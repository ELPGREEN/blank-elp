import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OTRLead {
  id: string;
  name: string;
  email: string;
  company: string | null;
  message: string;
  status: string;
  created_at: string;
}

const parseOTRMessage = (message: string) => {
  const data: Record<string, string> = {
    sourceCompany: '',
    sourceType: '',
    location: '',
    volume: '',
  };

  const lines = message.split('\n');
  let section = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.includes('FONTE INDICADA:')) section = 'source';
    if (section === 'source') {
      if (trimmed.startsWith('- Empresa Geradora:')) data.sourceCompany = trimmed.replace('- Empresa Geradora:', '').trim();
      if (trimmed.startsWith('- Tipo:')) data.sourceType = trimmed.replace('- Tipo:', '').trim();
      if (trimmed.startsWith('- Localização:')) data.location = trimmed.replace('- Localização:', '').trim();
      if (trimmed.startsWith('- Volume Anual Estimado:')) data.volume = trimmed.replace('- Volume Anual Estimado:', '').trim();
    }
  }
  return data;
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Weekly report function invoked");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      throw new Error("Email service not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || Deno.env.get("URL_SUPABASE") || Deno.env.get("URL_SUPABAS");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Calculate date range (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    console.log(`Fetching leads from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Fetch leads from last week
    const { data: leads, error: leadsError } = await supabase
      .from('contacts')
      .select('*')
      .eq('channel', 'otr-source-indication')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (leadsError) {
      console.error("Error fetching leads:", leadsError);
      throw leadsError;
    }

    // Fetch all-time stats for context
    const { data: allLeads, error: allLeadsError } = await supabase
      .from('contacts')
      .select('status')
      .eq('channel', 'otr-source-indication');

    if (allLeadsError) {
      console.error("Error fetching all leads:", allLeadsError);
      throw allLeadsError;
    }

    // Calculate stats
    const weeklyStats = {
      total: leads?.length || 0,
      pending: leads?.filter(l => l.status === 'pending').length || 0,
      approved: leads?.filter(l => l.status === 'approved').length || 0,
      contacted: leads?.filter(l => l.status === 'contacted').length || 0,
      negotiating: leads?.filter(l => l.status === 'negotiating').length || 0,
      converted: leads?.filter(l => l.status === 'converted').length || 0,
      rejected: leads?.filter(l => l.status === 'rejected').length || 0,
    };

    const allTimeStats = {
      total: allLeads?.length || 0,
      converted: allLeads?.filter(l => l.status === 'converted').length || 0,
    };

    const conversionRate = allTimeStats.total > 0 
      ? Math.round((allTimeStats.converted / allTimeStats.total) * 100) 
      : 0;

    // Generate leads table rows
    const leadsTableRows = (leads || []).slice(0, 10).map((lead: OTRLead) => {
      const parsed = parseOTRMessage(lead.message);
      const statusLabels: Record<string, string> = {
        pending: 'Pendente',
        approved: 'Aprovado',
        contacted: 'Contatado',
        negotiating: 'Negociando',
        converted: 'Convertido',
        rejected: 'Rejeitado',
      };
      const statusColors: Record<string, string> = {
        pending: '#f59e0b',
        approved: '#10b981',
        contacted: '#3b82f6',
        negotiating: '#8b5cf6',
        converted: '#059669',
        rejected: '#ef4444',
      };
      return `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 8px; font-size: 13px;">${new Date(lead.created_at).toLocaleDateString('pt-BR')}</td>
          <td style="padding: 12px 8px; font-size: 13px;">${lead.name}</td>
          <td style="padding: 12px 8px; font-size: 13px;">${parsed.sourceCompany || 'N/A'}</td>
          <td style="padding: 12px 8px; font-size: 13px;">${parsed.location || 'N/A'}</td>
          <td style="padding: 12px 8px;">
            <span style="background-color: ${statusColors[lead.status] || '#6b7280'}20; color: ${statusColors[lead.status] || '#6b7280'}; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">
              ${statusLabels[lead.status] || lead.status}
            </span>
          </td>
        </tr>
      `;
    }).join('');

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 700px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #065f46 0%, #047857 100%); padding: 30px 40px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">📊 Relatório Semanal OTR</h1>
            <p style="color: #a7f3d0; margin: 10px 0 0 0; font-size: 14px;">
              ${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}
            </p>
          </div>
          
          <!-- Stats Cards -->
          <div style="padding: 30px 40px;">
            <h2 style="color: #111827; font-size: 18px; margin: 0 0 20px 0;">Resumo da Semana</h2>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
              <tr>
                <td width="33%" style="padding: 8px;">
                  <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; text-align: center; border-left: 4px solid #64748b;">
                    <div style="font-size: 28px; font-weight: 700; color: #1e293b;">${weeklyStats.total}</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Novos Leads</div>
                  </div>
                </td>
                <td width="33%" style="padding: 8px;">
                  <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; text-align: center; border-left: 4px solid #10b981;">
                    <div style="font-size: 28px; font-weight: 700; color: #1e293b;">${weeklyStats.approved}</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Aprovados</div>
                  </div>
                </td>
                <td width="33%" style="padding: 8px;">
                  <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; text-align: center; border-left: 4px solid #059669;">
                    <div style="font-size: 28px; font-weight: 700; color: #1e293b;">${weeklyStats.converted}</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Convertidos</div>
                  </div>
                </td>
              </tr>
              <tr>
                <td width="33%" style="padding: 8px;">
                  <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; text-align: center; border-left: 4px solid #f59e0b;">
                    <div style="font-size: 28px; font-weight: 700; color: #1e293b;">${weeklyStats.pending}</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Pendentes</div>
                  </div>
                </td>
                <td width="33%" style="padding: 8px;">
                  <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; text-align: center; border-left: 4px solid #8b5cf6;">
                    <div style="font-size: 28px; font-weight: 700; color: #1e293b;">${weeklyStats.negotiating}</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Negociando</div>
                  </div>
                </td>
                <td width="33%" style="padding: 8px;">
                  <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; text-align: center; border-left: 4px solid #3b82f6;">
                    <div style="font-size: 28px; font-weight: 700; color: #1e293b;">${conversionRate}%</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Taxa Conversão</div>
                  </div>
                </td>
              </tr>
            </table>
            
            ${weeklyStats.pending > 0 ? `
            <!-- Alert for pending leads -->
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin-bottom: 30px;">
              <div style="display: flex; align-items: center;">
                <span style="font-size: 20px; margin-right: 12px;">⚠️</span>
                <div>
                  <strong style="color: #92400e;">Atenção!</strong>
                  <p style="margin: 4px 0 0 0; color: #a16207; font-size: 14px;">
                    Existem ${weeklyStats.pending} leads aguardando aprovação.
                  </p>
                </div>
              </div>
            </div>
            ` : ''}
            
            <!-- Recent Leads Table -->
            ${(leads || []).length > 0 ? `
            <h2 style="color: #111827; font-size: 18px; margin: 0 0 20px 0;">Últimos Leads</h2>
            <div style="overflow-x: auto;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #f8fafc;">
                    <th style="padding: 12px 8px; text-align: left; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase;">Data</th>
                    <th style="padding: 12px 8px; text-align: left; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase;">Indicador</th>
                    <th style="padding: 12px 8px; text-align: left; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase;">Fonte</th>
                    <th style="padding: 12px 8px; text-align: left; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase;">Local</th>
                    <th style="padding: 12px 8px; text-align: left; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase;">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${leadsTableRows}
                </tbody>
              </table>
            </div>
            ${(leads || []).length > 10 ? `<p style="color: #64748b; font-size: 13px; margin-top: 12px;">... e mais ${(leads || []).length - 10} leads</p>` : ''}
            ` : `
            <div style="text-align: center; padding: 40px; background-color: #f8fafc; border-radius: 8px;">
              <span style="font-size: 48px;">📭</span>
              <p style="color: #64748b; margin-top: 16px;">Nenhum novo lead nesta semana.</p>
            </div>
            `}
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">
              Relatório gerado automaticamente pelo sistema ELP Green Technology
            </p>
            <p style="color: #9ca3af; font-size: 11px; margin: 8px 0 0 0;">
              ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Get admin emails to send report (from profiles with admin role or use default)
    const { data: adminProfiles } = await supabase
      .from('profiles')
      .select('email')
      .eq('role', 'admin');

    const recipientEmails = adminProfiles?.map(p => p.email).filter(Boolean) || [];
    
    // Default internal email
    const defaultEmail = 'contato@elpgreen.tech';
    if (!recipientEmails.includes(defaultEmail)) {
      recipientEmails.push(defaultEmail);
    }

    console.log("Sending weekly report to:", recipientEmails);

    // Send email via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "ELP Green Technology <noreply@elpgreen.tech>",
        to: recipientEmails,
        subject: `📊 Relatório Semanal OTR - ${startDate.toLocaleDateString('pt-BR')} a ${endDate.toLocaleDateString('pt-BR')}`,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Resend API error:", errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const emailResult = await emailResponse.json();
    console.log("Email sent successfully:", emailResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Weekly report sent successfully",
        stats: weeklyStats,
        recipients: recipientEmails.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in send-weekly-report:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
