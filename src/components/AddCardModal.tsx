import { useState } from "react";
import styles from "./CardModal.module.css";

interface Props {
  columnId: string;
  columnTitle: string;
  open: boolean;
  onClose: () => void;
  onCreate: (data: {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    columnId: string;
    assigneeEmail: string;
  }) => void;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function AddCardModal({
  columnId,
  columnTitle,
  open,
  onClose,
  onCreate,
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(todayISO);
  const [endDate, setEndDate] = useState(todayISO);
  const [assigneeEmail, setAssigneeEmail] = useState("");

  if (!open) return null;

  return (
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h2 className={styles.title}>Novo cartão — {columnTitle}</h2>
        <label className={styles.field}>
          Título
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={styles.input}
            autoFocus
          />
        </label>
        <label className={styles.field}>
          Descrição
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={styles.textarea}
            rows={3}
          />
        </label>
        <div className={styles.row2}>
          <label className={styles.field}>
            Início
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={styles.input}
            />
          </label>
          <label className={styles.field}>
            Fim
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={styles.input}
            />
          </label>
        </div>
        <label className={styles.field}>
          E-mail do responsável (opcional)
          <input
            type="email"
            value={assigneeEmail}
            onChange={(e) => setAssigneeEmail(e.target.value)}
            className={styles.input}
          />
        </label>
        <div className={styles.actions}>
          <div className={styles.spacer} />
          <button type="button" className={styles.ghost} onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className={styles.primary}
            onClick={() => {
              onCreate({
                title: title.trim() || "Novo cartão",
                description: description.trim(),
                startDate,
                endDate,
                columnId,
                assigneeEmail: assigneeEmail.trim(),
              });
              setTitle("");
              setDescription("");
              setStartDate(todayISO());
              setEndDate(todayISO());
              setAssigneeEmail("");
              onClose();
            }}
          >
            Criar
          </button>
        </div>
      </div>
    </div>
  );
}
