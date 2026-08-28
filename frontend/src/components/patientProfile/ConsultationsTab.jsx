import HistoryTimeline from "../history/HistoryTimeline";

export default function ConsultationsTab({ patientId }) {
  return (
    <HistoryTimeline patientId={patientId} />
  );
}