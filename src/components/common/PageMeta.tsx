import { HelmetProvider, Helmet } from "react-helmet-async";

const PageMeta = ({
  description,
}: {
  description: string;
}) => (
  <Helmet>
    <title></title>
    <meta name="description" content={description} />
  </Helmet>
);

export const AppWrapper = ({ children }: { children: React.ReactNode }) => (
  <HelmetProvider>{children}</HelmetProvider>
);

export default PageMeta;
