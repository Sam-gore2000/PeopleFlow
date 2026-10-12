import { PageTitle } from "../../components/common/PageTitle.jsx";
import { HANDBOOK_URL } from "../../constants/app.js";

export function HandbookPage() {
  return (
    <div className="handBook">
      <PageTitle>Employee Handbook</PageTitle>
      <iframe title="HR Induction" src={HANDBOOK_URL} width="100%" height="680" />
      <div className="d-flex justify-content-end">
        <a className="btn btn-primary" href={HANDBOOK_URL} download><i className="bi bi-download" /> Download</a>
      </div>
    </div>
  );
}
