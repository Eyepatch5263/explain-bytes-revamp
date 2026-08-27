import { Expand, Loader2 } from "lucide-react";
import { useEffect, useId, useState } from "react";

type MermaidDiagramProps = {
  chart: string;
};

const normaliseChart = (chart: string) =>
  chart.replaceAll("[nl]", "\n").replaceAll("[br]", "<br/>");

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const id = `mermaid-${useId().replace(/[^a-z0-9]/gi, "")}`;
  const [svg, setSvg] = useState("");
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let active = true;
    const render = async () => {
      try {
        const { default: mermaid } = await import("mermaid");
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          theme: document.documentElement.classList.contains("dark") ? "dark" : "base",
          themeVariables: {
            primaryColor: "#e66b5b",
            primaryTextColor: "#13221e",
            primaryBorderColor: "#13221e",
            lineColor: "#6d7a74",
            secondaryColor: "#f3f0e8",
            tertiaryColor: "#dce3d8",
            background: "transparent",
            mainBkg: document.documentElement.classList.contains("dark") ? "#13221e" : "#f3f0e8",
            nodeBorder: "#6d7a74",
          },
          flowchart: { curve: "basis", htmlLabels: true },
        });
        const result = await mermaid.render(id, normaliseChart(chart));
        if (active) setSvg(result.svg);
      } catch (renderError) {
        console.error("Mermaid rendering failed", renderError);
        if (active) setError(true);
      }
    };
    void render();
    return () => {
      active = false;
    };
  }, [chart, id]);

  if (error) {
    return <pre className="flashdocs-diagram-fallback">{normaliseChart(chart)}</pre>;
  }

  const diagram = svg ? (
    <div className="flashdocs-mermaid" dangerouslySetInnerHTML={{ __html: svg }} />
  ) : (
    <div className="flashdocs-diagram-loading"><Loader2 size={17} /> Rendering diagram</div>
  );

  return (
    <figure className="flashdocs-diagram">
      <button className="flashdocs-diagram-expand" type="button" onClick={() => setExpanded(true)} aria-label="Expand diagram">
        <Expand size={15} /> Expand
      </button>
      {diagram}
      {expanded && (
        <div className="flashdocs-diagram-modal" role="dialog" aria-modal="true" aria-label="Expanded diagram" onClick={() => setExpanded(false)}>
          <div className="flashdocs-diagram-modal__canvas" onClick={(event) => event.stopPropagation()}>
            <button className="flashdocs-diagram-modal__close" type="button" onClick={() => setExpanded(false)}>Close</button>
            {diagram}
          </div>
        </div>
      )}
    </figure>
  );
}
