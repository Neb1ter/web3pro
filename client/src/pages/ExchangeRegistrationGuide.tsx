import { useEffect } from "react";
import { useLocation, useRoute } from "wouter";

export default function ExchangeRegistrationGuide() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/exchange-registration/:slug");
  const slug = params?.slug ?? "gate";

  useEffect(() => {
    setLocation(`/exchange-download?exchange=${slug}#registration-guide`);
  }, [setLocation, slug]);

  return null;
}
