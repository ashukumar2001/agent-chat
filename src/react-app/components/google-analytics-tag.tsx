import { Helmet } from "react-helmet-async";

const GoogleAnalyticsTags = () => {
  const googleAnalyticsId = import.meta.env.VITE_GOOGLE_ANALYTICS_ID;

  if (!googleAnalyticsId) {
    return null;
  }
  return (
    <Helmet>
      {/* Google tag (gtag.js) script */}
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
      ></script>
      <script>
        {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${googleAnalyticsId}');
      `}
      </script>
    </Helmet>
  );
};

export default GoogleAnalyticsTags;
