import React from "react";
import { ArrowRight } from "lucide-react";

export function Feature({ icon: Icon, title, text }) {
  return (
    <article className="feature-card">
      <span className="feature-icon">
        <Icon size={19} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      <ArrowRight size={15} className="feature-arrow" />
    </article>
  );
}

export default Feature;
