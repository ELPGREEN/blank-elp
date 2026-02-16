import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WebhookNotificationRequest {
  event: string;
  leadId: string;
  leadName: string;
  leadCompany?: string;
  sourceCompany?: string;
  sourceType?: string;
  location?: string;
  volume?: string;
  status?: string;
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Webhook notification function invoked");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: WebhookNotificationRequest = await req.json();
    console.log("Webhook payload:", JSON.stringify(payload));

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || Deno.env.get("URL_SUPABASE") || Deno.env.get("URL_SUPABAS");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch active webhooks for this event
    const { data: webhooks, error: webhooksError } = await supabase
      .from('notification_webhooks')
      .select('*')
      .eq('is_active', true)
      .contains('events', [payload.event]);

    if (webhooksError) {
      console.error("Error fetching webhooks:", webhooksError);
      throw webhooksError;
    }

    if (!webhooks || webhooks.length === 0) {
      console.log("No active webhooks found for event:", payload.event);
      return new Response(
        JSON.stringify({ success: true, message: "No webhooks configured", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${webhooks.length} webhooks for event: ${payload.event}`);

    const eventTitles: Record<string, string> = {
      lead_approved: '✅ Lead OTR Aprovado',
      lead_converted: '🎉 Lead OTR Convertido',
      lead_rejected: '❌ Lead OTR Rejeitado',
      lead_new: '🆕 Novo Lead OTR',
    };

    const eventColors: Record<string, string> = {
      lead_approved: '#10b981',
      lead_converted: '#059669',
      lead_rejected: '#ef4444',
      lead_new: '#3b82f6',
    };

    const results = await Promise.allSettled(webhooks.map(async (webhook) => {
      let body: Record<string, unknown>;

      if (webhook.webhook_type === 'slack') {
        // Slack message format
        body = {
          blocks: [
            {
              type: "header",
              text: {
                type: "plain_text",
                text: eventTitles[payload.event] || `Lead OTR: ${payload.event}`,
                emoji: true
              }
            },
            {
              type: "section",
              fields: [
                {
                  type: "mrkdwn",
                  text: `*Indicador:*\n${payload.leadName}`
                },
                {
                  type: "mrkdwn",
                  text: `*Empresa:*\n${payload.leadCompany || 'N/A'}`
                },
                {
                  type: "mrkdwn",
                  text: `*Fonte OTR:*\n${payload.sourceCompany || 'N/A'}`
                },
                {
                  type: "mrkdwn",
                  text: `*Tipo:*\n${payload.sourceType || 'N/A'}`
                },
                {
                  type: "mrkdwn",
                  text: `*Localização:*\n${payload.location || 'N/A'}`
                },
                {
                  type: "mrkdwn",
                  text: `*Volume:*\n${payload.volume || 'N/A'}`
                }
              ]
            },
            {
              type: "context",
              elements: [
                {
                  type: "mrkdwn",
                  text: `📅 ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} | ELP Green Technology`
                }
              ]
            }
          ]
        };
      } else if (webhook.webhook_type === 'teams') {
        // Microsoft Teams message format (Adaptive Card)
        body = {
          "@type": "MessageCard",
          "@context": "http://schema.org/extensions",
          themeColor: eventColors[payload.event] || '#3b82f6',
          summary: eventTitles[payload.event] || `Lead OTR: ${payload.event}`,
          sections: [{
            activityTitle: eventTitles[payload.event] || `Lead OTR: ${payload.event}`,
            facts: [
              { name: "Indicador", value: payload.leadName },
              { name: "Empresa", value: payload.leadCompany || 'N/A' },
              { name: "Fonte OTR", value: payload.sourceCompany || 'N/A' },
              { name: "Tipo", value: payload.sourceType || 'N/A' },
              { name: "Localização", value: payload.location || 'N/A' },
              { name: "Volume", value: payload.volume || 'N/A' },
            ],
            markdown: true
          }],
          potentialAction: []
        };
      } else if (webhook.webhook_type === 'discord') {
        // Discord webhook format
        body = {
          embeds: [{
            title: eventTitles[payload.event] || `Lead OTR: ${payload.event}`,
            color: parseInt(eventColors[payload.event]?.replace('#', '') || '3b82f6', 16),
            fields: [
              { name: "Indicador", value: payload.leadName, inline: true },
              { name: "Empresa", value: payload.leadCompany || 'N/A', inline: true },
              { name: "Fonte OTR", value: payload.sourceCompany || 'N/A', inline: true },
              { name: "Tipo", value: payload.sourceType || 'N/A', inline: true },
              { name: "Localização", value: payload.location || 'N/A', inline: true },
              { name: "Volume", value: payload.volume || 'N/A', inline: true },
            ],
            footer: {
              text: `ELP Green Technology • ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`
            }
          }]
        };
      } else {
        throw new Error(`Unknown webhook type: ${webhook.webhook_type}`);
      }

      console.log(`Sending to ${webhook.webhook_type} webhook: ${webhook.name}`);

      const response = await fetch(webhook.webhook_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Webhook ${webhook.name} failed:`, errorText);
        throw new Error(`Webhook failed: ${errorText}`);
      }

      console.log(`Webhook ${webhook.name} sent successfully`);
      return { webhook: webhook.name, success: true };
    }));

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Webhooks sent: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Sent ${successful} notifications`,
        sent: successful,
        failed: failed
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in send-webhook-notification:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
