import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

Deno.test("analyze-feasibility: should analyze with Gemini API", async () => {
  const minimalStudy = {
    project_name: "Test OTR Plant",
    country: "Brazil",
    region: "São Paulo",
    daily_capacity_tons: 50,
    operating_days_per_year: 300,
    utilization_rate: 85,
    plant_cost_usd: 5000000,
    annual_revenue: 3000000,
    annual_opex: 1500000,
    annual_ebitda: 1500000,
    payback_years: 3.5,
    irr: 25,
    npv: 2000000,
    rubber_granules_yield: 45,
    rubber_granules_price: 350,
    steel_wire_yield: 25,
    steel_wire_price: 200,
    textile_fiber_yield: 20,
    textile_fiber_price: 50,
    government_royalties_percent: 0,
    environmental_bonus_per_ton: 0
  };

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/analyze-feasibility`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        study: minimalStudy,
        language: "pt",
        model: "flash"  // Use Gemini flash
      }),
    }
  );

  const responseText = await response.text();
  console.log("Response status:", response.status);
  console.log("Response:", responseText.substring(0, 500));

  assertEquals(response.status, 200, `Expected 200, got ${response.status}: ${responseText}`);
  
  const data = JSON.parse(responseText);
  assertExists(data.analysis, "Response should contain analysis");
  assertExists(data.model_used, "Response should indicate model used");
  
  console.log("✅ analyze-feasibility test passed!");
  console.log("Model used:", data.model_used);
});

Deno.test("analyze-feasibility: should fallback to Anthropic if needed", async () => {
  const minimalStudy = {
    project_name: "Test OTR Plant Pro",
    country: "Australia",
    region: "New South Wales",
    daily_capacity_tons: 100,
    operating_days_per_year: 280,
    utilization_rate: 80,
    plant_cost_usd: 8000000,
    annual_revenue: 5000000,
    annual_opex: 2500000,
    annual_ebitda: 2500000,
    payback_years: 3.2,
    irr: 28,
    npv: 3500000,
    rubber_granules_yield: 45,
    rubber_granules_price: 400,
    steel_wire_yield: 25,
    steel_wire_price: 250,
    textile_fiber_yield: 20,
    textile_fiber_price: 60,
    government_royalties_percent: 5,
    environmental_bonus_per_ton: 10
  };

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/analyze-feasibility`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        study: minimalStudy,
        language: "en",
        model: "pro"  // Use Anthropic Claude
      }),
    }
  );

  const responseText = await response.text();
  console.log("Response status:", response.status);
  console.log("Response (pro model):", responseText.substring(0, 500));

  assertEquals(response.status, 200, `Expected 200, got ${response.status}: ${responseText}`);
  
  const data = JSON.parse(responseText);
  assertExists(data.analysis, "Response should contain analysis");
  
  console.log("✅ analyze-feasibility (pro/anthropic) test passed!");
  console.log("Model used:", data.model_used);
  console.log("Did fallback:", data.did_fallback);
});
