import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || Deno.env.get("URL_SUPABASE") || Deno.env.get("URL_SUPABAS");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OTRApprovalRequest {
  leadId: string;
  leadName: string;
  leadEmail: string;
  leadCompany: string | null;
  sourceCompany: string;
  sourceType: string;
  location: string;
  volume: string;
  tireSizes: string;
  details: string;
  approvedBy: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: OTRApprovalRequest = await req.json();
    
    console.log("Sending OTR approval notification for lead:", data.leadId);

    // Send notification to internal team
    const teamNotificationResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "ELP Green Technology <info@elpgreen.com>",
        to: ["elpenergia@gmail.com", "info@elpgreen.com"],
        subject: `✅ Lead OTR Aprovado: ${data.sourceCompany}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #065f46, #047857); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: #fff; margin: 0; font-size: 24px;">Lead OTR Aprovado</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">
                Nova indicação de fonte OTR aprovada para follow-up comercial
              </p>
            </div>
            
            <div style="background: #f0fdf4; padding: 30px; border-radius: 0 0 10px 10px;">
              <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                <span style="background: #10b981; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">
                  APROVADO
                </span>
                <span style="background: #e5e7eb; color: #374151; padding: 6px 12px; border-radius: 20px; font-size: 12px;">
                  ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              
              <div style="background: white; padding: 25px; border-radius: 12px; border: 1px solid #d1fae5; margin-bottom: 20px;">
                <h2 style="color: #065f46; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #10b981; padding-bottom: 10px;">
                  📋 Dados do Indicador
                </h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; width: 120px;">Nome:</td>
                    <td style="padding: 8px 0; color: #1f2937; font-weight: 500;">${data.leadName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Email:</td>
                    <td style="padding: 8px 0; color: #1f2937;"><a href="mailto:${data.leadEmail}" style="color: #047857;">${data.leadEmail}</a></td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Empresa:</td>
                    <td style="padding: 8px 0; color: #1f2937;">${data.leadCompany || 'N/A'}</td>
                  </tr>
                </table>
              </div>
              
              <div style="background: white; padding: 25px; border-radius: 12px; border: 1px solid #d1fae5; margin-bottom: 20px;">
                <h2 style="color: #065f46; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #10b981; padding-bottom: 10px;">
                  🏭 Dados da Fonte OTR
                </h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; width: 140px;">Empresa Geradora:</td>
                    <td style="padding: 8px 0; color: #1f2937; font-weight: bold; font-size: 16px;">${data.sourceCompany}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Tipo de Fonte:</td>
                    <td style="padding: 8px 0; color: #1f2937;">${data.sourceType}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Localização:</td>
                    <td style="padding: 8px 0; color: #1f2937; font-weight: 500;">${data.location}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Volume Anual:</td>
                    <td style="padding: 8px 0; color: #1f2937;">${data.volume || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Medidas OTR:</td>
                    <td style="padding: 8px 0; color: #1f2937;">${data.tireSizes || 'N/A'}</td>
                  </tr>
                </table>
              </div>
              
              ${data.details ? `
              <div style="background: white; padding: 25px; border-radius: 12px; border: 1px solid #d1fae5; margin-bottom: 20px;">
                <h2 style="color: #065f46; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #10b981; padding-bottom: 10px;">
                  📝 Detalhes Adicionais
                </h2>
                <p style="color: #374151; line-height: 1.6; margin: 0; white-space: pre-wrap;">${data.details}</p>
              </div>
              ` : ''}
              
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; border-radius: 0 8px 8px 0; margin-bottom: 20px;">
                <p style="margin: 0; color: #92400e; font-weight: 500;">
                  ⚡ Próximos Passos
                </p>
                <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #92400e;">
                  <li>Entrar em contato com o indicador</li>
                  <li>Agendar visita à fonte OTR</li>
                  <li>Avaliar viabilidade logística</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 25px 0;">
                <a href="https://elpgreen.com/admin" style="background: #065f46; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  Acessar Painel Admin
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #d1fae5; margin: 25px 0;">
              
              <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
                Aprovado por: ${data.approvedBy} | ID: ${data.leadId.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </div>
        `,
      }),
    });

    const result = await teamNotificationResponse.json();
    console.log("Team notification sent:", result);

    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending OTR approval notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
