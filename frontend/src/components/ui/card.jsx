import React from "react";

const cardStyle = {
  borderRadius: "0.5rem",
  border: "1px solid #e2e8f0",
  backgroundColor: "#ffffff",
  color: "#1a202c",
  boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
};

const Card = ({ style = {}, children }) => (
  <div style={{ ...cardStyle, ...style }}>
    {children}
  </div>
);

const cardHeaderStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.375rem",
  padding: "1.5rem",
};

const CardHeader = ({ style = {}, children }) => (
  <div style={{ ...cardHeaderStyle, ...style }}>
    {children}
  </div>
);

const cardTitleStyle = {
  fontSize: "1.5rem",
  fontWeight: "600",
  lineHeight: "1.25",
  letterSpacing: "-0.025em",
};

const CardTitle = ({ style = {}, children }) => (
  <h3 style={{ ...cardTitleStyle, ...style }}>
    {children}
  </h3>
);

const cardContentStyle = {
  padding: "1.5rem",
  paddingTop: "0",
};

const CardContent = ({ style = {}, children }) => (
  <div style={{ ...cardContentStyle, ...style }}>
    {children}
  </div>
);

export { Card, CardHeader, CardTitle, CardContent };