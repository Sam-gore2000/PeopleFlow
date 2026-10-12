import { HANDBOOK_URL } from "../../../constants/app.js";
import { POLICIES, POLICY_ACTIONS } from "../dashboard.data.js";

function PolicyItem({ policy }) {
  return (
    <div className="policy-item">
      <span className="policy-tag">{policy.tag}</span>
      <div className="policy-icon"><i className={`bi ${policy.icon}`} /></div>
      <h5>{policy.title}</h5>
      <p>{policy.body}</p>
      <div className="policy-divider" />
      <div className="policy-footer">
        <span>{policy.meta}</span>
        <div className="policy-actions">
          <i className="bi bi-eye" />
          <a href={HANDBOOK_URL} target="_blank"><i className="bi bi-download" /></a>
        </div>
      </div>
    </div>
  );
}

function PolicyActionBox({ action }) {
  return (
    <div className="policy-action-box">
      <div className="action-icon"><i className={`bi ${action.icon}`} /></div>
      <div><h6>{action.title}</h6><p>{action.body}</p></div>
      <i className="bi bi-chevron-right" />
    </div>
  );
}

export function PoliciesCard() {
  return (
    <div className="policies-card">
      <div className="policies-header">
        <div><h4>Company Policies</h4><p>Quick access to important documents</p></div>
        <div className="policies-header-icon"><i className="bi bi-file-earmark-text" /></div>
      </div>
      <div className="policies-grid">{POLICIES.map((policy) => <PolicyItem key={policy.title} policy={policy} />)}</div>
      <div className="policies-bottom">{POLICY_ACTIONS.map((action) => <PolicyActionBox key={action.title} action={action} />)}</div>
    </div>
  );
}
