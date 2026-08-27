import { Children, cloneElement, isValidElement, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { AlertTriangle, CircleAlert, Info, Lightbulb } from "lucide-react";
import { MathFormula } from "./MathFormula";
import { MermaidDiagram } from "./MermaidDiagram";
import "./systemDesignMdx.css";

function Pre({ children, ...props }: ComponentPropsWithoutRef<"pre">) {
  return <pre className="flashdocs-code" {...props}>{children}</pre>;
}

function Table({ children, ...props }: ComponentPropsWithoutRef<"table">) {
  return <div className="flashdocs-table-wrap"><table {...props}>{children}</table></div>;
}

const alertPattern = /\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i;
const alertIcon = { NOTE: Info, TIP: Lightbulb, IMPORTANT: CircleAlert, WARNING: AlertTriangle, CAUTION: AlertTriangle };

function toText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(toText).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return toText(node.props.children);
  return "";
}

function stripMarker(node: ReactNode): ReactNode {
  if (typeof node === "string") return node.replace(alertPattern, "");
  if (Array.isArray(node)) return node.map(stripMarker);
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return cloneElement(node, node.props, Children.map(node.props.children, stripMarker));
  }
  return node;
}

function Blockquote({ children, ...props }: ComponentPropsWithoutRef<"blockquote">) {
  const alert = toText(children).match(alertPattern)?.[1]?.toUpperCase() as keyof typeof alertIcon | undefined;
  if (!alert) return <blockquote className="flashdocs-callout" {...props}>{children}</blockquote>;
  const Icon = alertIcon[alert];
  return <aside className={`flashdocs-callout flashdocs-callout--${alert.toLowerCase()}`} {...props}>
    <span className="flashdocs-callout-label"><Icon size={14} /> {alert}</span>
    <div>{stripMarker(children)}</div>
  </aside>;
}

export const systemDesignMdxComponents = {
  Mermaid: MermaidDiagram,
  Math: MathFormula,
  pre: Pre,
  table: Table,
  blockquote: Blockquote,
};
