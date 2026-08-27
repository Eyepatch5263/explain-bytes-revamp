import { BlockMath, InlineMath } from "react-katex";

type MathFormulaProps = {
  formula: string;
  block?: boolean;
};

export function MathFormula({ formula, block = false }: MathFormulaProps) {
  try {
    return block ? (
      <div className="flashdocs-math-block"><BlockMath math={formula} /></div>
    ) : (
      <InlineMath math={formula} />
    );
  } catch {
    return <code>{formula}</code>;
  }
}
