import { ImprovedPixelIcon } from './ImprovedPixelIcon';

interface CalculatorComingSoonProps {
  professionId: string;
  professionName: string;
  tag: string | null;
}

export function CalculatorComingSoon({ professionId, professionName, tag }: CalculatorComingSoonProps) {
  return (
    <div className="panel">
      <div className="coming-soon-header">
        <ImprovedPixelIcon id={professionId} tone="spec" size={80} showTooltip={false} />
        <div>
          <h2 className="panel-title" style={{ margin: 0 }}>{professionName} Calculator</h2>
          {tag && <div className="tag">{tag}</div>}
        </div>
      </div>
      <div className="coming-soon-content">
        <p className="callout warn">
          <strong>Coming Soon</strong>
        </p>
        <p>
          The {professionName} calculator is under development. It will help you calculate production economics,
          equipment costs, material requirements, and profitability for this profession.
        </p>
        <h3 className="section-h">Planned Features</h3>
        <ul className="pix-list">
          <li>Equipment and module selection with costs</li>
          <li>Production target and material requirements calculator</li>
          <li>Quality and output estimation based on equipment and upgrades</li>
          <li>Budget planning with rent and operational costs</li>
          <li>Integration with Character Builder for specialization bonuses</li>
          <li>Source-verified game data and formulas</li>
        </ul>
        <p className="muted">
          No placeholder calculations or fictional formulas will be shown. Real verified game mechanics only.
        </p>
        <div className="btn-row">
          <button type="button" onClick={() => window.location.hash = '#/'}>← Back to Home</button>
          <button type="button" className="primary" onClick={() => window.location.hash = '#/character-builder'}>
            Open Character Builder
          </button>
        </div>
      </div>
    </div>
  );
}
