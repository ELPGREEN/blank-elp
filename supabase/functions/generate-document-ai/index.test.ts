import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

Deno.test("generate-document-ai: should generate NDA document with Gemini", async () => {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/generate-document-ai`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        templateType: "nda",
        country: "Brazil",
        language: "pt",
        existingFields: {
          disclosing_party: "ELP Green Technology",
          receiving_party: "Partner Company",
          purpose: "OTR Tire Recycling Partnership Discussion",
          duration: "2 years"
        },
        generateFullDocument: false
      }),
    }
  );

  const responseText = await response.text();
  console.log("Response status:", response.status);
  console.log("Response:", responseText.substring(0, 800));

  assertEquals(response.status, 200, `Expected 200, got ${response.status}: ${responseText}`);
  
  const data = JSON.parse(responseText);
  assertExists(data, "Response should contain data");
  
  console.log("✅ generate-document-ai NDA test passed!");
});

Deno.test("generate-document-ai: should generate Joint Venture document", async () => {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/generate-document-ai`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        templateType: "joint_venture",
        country: "Australia",
        language: "en",
        existingFields: {
          partner_a: "ELP Green Technology",
          partner_b: "Australian Mining Corp",
          jv_name: "OTR Recycling Australia JV",
          jv_purpose: "OTR tire recycling operations",
          partner_a_contribution: "Technology and expertise",
          partner_b_contribution: "OTR tire sources and local operations",
          profit_share_a: "50%",
          profit_share_b: "50%"
        },
        generateFullDocument: false
      }),
    }
  );

  const responseText = await response.text();
  console.log("Response status:", response.status);
  console.log("Response (JV):", responseText.substring(0, 800));

  assertEquals(response.status, 200, `Expected 200, got ${response.status}: ${responseText}`);
  
  const data = JSON.parse(responseText);
  assertExists(data, "Response should contain data");
  
  console.log("✅ generate-document-ai Joint Venture test passed!");
});

Deno.test("generate-document-ai: should generate LOI document", async () => {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/generate-document-ai`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        templateType: "loi",
        country: "China",
        language: "zh",
        existingFields: {
          buyer: "Chinese Mining Company",
          seller: "ELP Green Technology",
          transaction_type: "Technology Partnership",
          transaction_value: "$5,000,000 USD"
        },
        generateFullDocument: false
      }),
    }
  );

  const responseText = await response.text();
  console.log("Response status:", response.status);
  console.log("Response (LOI):", responseText.substring(0, 800));

  assertEquals(response.status, 200, `Expected 200, got ${response.status}: ${responseText}`);
  
  console.log("✅ generate-document-ai LOI test passed!");
});
