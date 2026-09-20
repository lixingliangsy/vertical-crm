import type { AppProps } from 'next/app'
import Head from 'next/head'
import Script from 'next/script'
import '../styles/globals.css'
import ChatWidget from '../components/ChatWidget'
import { SUPPORT } from '../lib/support.config'

const UMAMI_ID = process.env.NEXT_PUBLIC_UMAMI_ID
const UMAMI_URL = (process.env.NEXT_PUBLIC_UMAMI_URL || 'https://analytics.umami.is').replace(/\/$/, '')

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      {UMAMI_ID && (
        <Script
          async
          src={`${UMAMI_URL}/script.js`}
          data-website-id={UMAMI_ID}
          strategy="afterInteractive"
        />
      )}
            <><Head>
        <meta property="og:type" content="website" />
        <meta property="og:title" content="TradeCRM" />
        <meta property="og:description" content="Pick your trade and get a simple pipeline - leads, jobs, follow-ups. For solo pros who hate generic CRMs built for every business but none of them." />
        <meta property="og:url" content="https://vertical-crm.lxsaihub.com/" />
        <meta property="og:image" content="https://vertical-crm.lxsaihub.com/og.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="TradeCRM" />
        <meta name="twitter:description" content="Pick your trade and get a simple pipeline - leads, jobs, follow-ups. For solo pros who hate generic CRMs built for every business but none of them." />
        <meta name="twitter:image" content="https://vertical-crm.lxsaihub.com/og.png" />
                                        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: '{"@context":"https://schema.org","@type":"SoftwareApplication","name":"TradeCRM","url":"https://vertical-crm.lxsaihub.com/","description":"Pick your trade and get a simple pipeline - leads, jobs, follow-ups. For solo pros who hate generic CRMs built for every business but none of them.","applicationCategory":"BusinessApplication","operatingSystem":"Web","offers":{"@type":"Offer","priceCurrency":"USD","price":"0","availability":"https://schema.org/OnlineOnly"}}' }} />
      </Head>
      <Component {...pageProps} />
      <ChatWidget productName={SUPPORT.productName} brandColor={SUPPORT.brandColor} sessionKeyPrefix={SUPPORT.productSlug} /></>
    </>
  )
}
