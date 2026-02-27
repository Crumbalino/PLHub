/**
 * PLHub Breakfast Digest — HTML email template.
 *
 * Mobile-first, dark theme, email-client compatible.
 * Uses inline styles and table layout for maximum compatibility
 * across Gmail, Apple Mail, Outlook, etc.
 */

import type { DigestContent, DigestStory } from './digest-content'

const COLORS = {
  bg: '#0B1F21',
  card: '#183538',
  gold: '#C4A23E',
  teal: '#00555A',
  text: '#ffffff',
  textMuted: '#ffffff99',
  textFaint: '#ffffff66',
  border: '#ffffff1a',
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://plhub.co.uk'

function storyRow(story: DigestStory, index: number): string {
  return `
    <tr>
      <td style="padding: 16px 0; border-bottom: 1px solid ${COLORS.border};">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="vertical-align: top; padding-right: 12px; width: 32px;">
              <div style="background: ${COLORS.teal}; color: ${COLORS.text}; font-size: 14px; font-weight: bold; width: 28px; height: 28px; border-radius: 6px; text-align: center; line-height: 28px;">
                ${index + 2}
              </div>
            </td>
            <td style="vertical-align: top;">
              <a href="${story.url}" style="color: ${COLORS.text}; text-decoration: none; font-size: 16px; font-weight: 600; line-height: 1.4; display: block;">
                ${story.title}
              </a>
              <p style="color: ${COLORS.textMuted}; font-size: 14px; line-height: 1.5; margin: 6px 0 0 0;">
                ${story.blurb}
              </p>
              <p style="margin: 8px 0 0 0;">
                <span style="color: ${COLORS.textFaint}; font-size: 12px;">
                  ${story.sourceName}
                </span>
                <span style="color: ${COLORS.gold}; font-size: 12px; font-weight: bold; margin-left: 8px;">
                  ⚡ ${story.pulseIndex}
                </span>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `
}

export function renderDigestEmail(content: DigestContent): string {
  const { date, greeting, topStory, stories, totalStoriesYesterday } = content

  const storyRows = stories.map((s, i) => storyRow(s, i)).join('')

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>PLHub Breakfast Digest — ${date}</title>
  <!--[if mso]>
  <style>
    table { border-collapse: collapse; }
    td { font-family: Arial, sans-serif; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.bg}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: ${COLORS.bg};">
    <tr>
      <td align="center" style="padding: 24px 16px;">

        <!-- Container -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 560px;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom: 24px; text-align: center;">
              <a href="${siteUrl}" style="text-decoration: none;">
                <span style="font-size: 24px; font-weight: bold; color: ${COLORS.text}; letter-spacing: -0.5px;">PL</span><span style="font-size: 24px; font-weight: bold; color: ${COLORS.gold}; letter-spacing: -0.5px;">Hub</span>
              </a>
              <p style="color: ${COLORS.textFaint}; font-size: 13px; margin: 4px 0 0 0; letter-spacing: 1px; text-transform: uppercase;">
                Breakfast Digest
              </p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding-bottom: 8px;">
              <p style="color: ${COLORS.textMuted}; font-size: 14px; margin: 0;">
                ${greeting} — here's what matters in the Premier League today.
              </p>
              <p style="color: ${COLORS.textFaint}; font-size: 12px; margin: 4px 0 0 0;">
                ${date} · ${totalStoriesYesterday} stories in the last 24h
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 16px 0;">
              <div style="height: 1px; background: ${COLORS.border};"></div>
            </td>
          </tr>

          <!-- Top Story (hero) -->
          <tr>
            <td style="padding-bottom: 24px;">
              <p style="color: ${COLORS.gold}; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 12px 0;">
                ⚡ Top Story
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background: ${COLORS.card}; border-radius: 12px; border-left: 4px solid ${COLORS.gold}; overflow: hidden;">
                ${topStory.imageUrl ? `
                <tr>
                  <td>
                    <a href="${topStory.url}" style="text-decoration: none;">
                      <img src="${topStory.imageUrl}" alt="" style="width: 100%; height: auto; max-height: 200px; object-fit: cover; display: block;" />
                    </a>
                  </td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 20px;">
                    <a href="${topStory.url}" style="color: ${COLORS.text}; text-decoration: none; font-size: 20px; font-weight: bold; line-height: 1.3; display: block;">
                      ${topStory.title}
                    </a>
                    <p style="color: ${COLORS.textMuted}; font-size: 15px; line-height: 1.6; margin: 12px 0 0 0;">
                      ${topStory.blurb}
                    </p>
                    <table cellpadding="0" cellspacing="0" role="presentation" style="margin-top: 16px;">
                      <tr>
                        <td style="background: ${COLORS.teal}; border-radius: 6px; padding: 8px 16px;">
                          <a href="${topStory.url}" style="color: ${COLORS.text}; text-decoration: none; font-size: 13px; font-weight: 600;">
                            Read more →
                          </a>
                        </td>
                        <td style="padding-left: 12px;">
                          <span style="color: ${COLORS.textFaint}; font-size: 12px;">
                            ${topStory.sourceName}
                          </span>
                          <span style="color: ${COLORS.gold}; font-size: 13px; font-weight: bold; margin-left: 6px;">
                            ⚡ ${topStory.pulseIndex}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Also Trending -->
          ${stories.length > 0 ? `
          <tr>
            <td>
              <p style="color: ${COLORS.textFaint}; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 8px 0;">
                Also Trending
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                ${storyRows}
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- CTA -->
          <tr>
            <td style="padding: 32px 0; text-align: center;">
              <table cellpadding="0" cellspacing="0" role="presentation" align="center">
                <tr>
                  <td style="background: ${COLORS.gold}; border-radius: 8px; padding: 12px 32px;">
                    <a href="${siteUrl}" style="color: ${COLORS.bg}; text-decoration: none; font-size: 14px; font-weight: bold;">
                      See all stories on PLHub →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 24px; border-top: 1px solid ${COLORS.border}; text-align: center;">
              <p style="color: ${COLORS.textFaint}; font-size: 12px; margin: 0; line-height: 1.6;">
                You're receiving this because you signed up for the PLHub Breakfast Digest.
                <br />
                <a href="${siteUrl}/unsubscribe" style="color: ${COLORS.textFaint}; text-decoration: underline;">Unsubscribe</a>
                ·
                <a href="${siteUrl}" style="color: ${COLORS.textFaint}; text-decoration: underline;">Visit PLHub</a>
              </p>
              <p style="color: ${COLORS.textFaint}; font-size: 11px; margin: 12px 0 0 0;">
                © PLHub ${new Date().getFullYear()} · Premier League news, ranked by what matters.
              </p>
            </td>
          </tr>

        </table>
        <!-- /Container -->

      </td>
    </tr>
  </table>
  <!-- /Wrapper -->

</body>
</html>
  `.trim()
}
