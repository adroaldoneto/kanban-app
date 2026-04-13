import { useEffect, useState } from "react";
import type { CardRow } from "../hooks/useBoardData";
import styles from "./CardModal.module.css";

interface Props {
  card: CardRow | null;
  open: boolean;
  onClose: () => void;
  onSave: (
    id: string,
    data: {
      title: string;
      description: string;
      startDate: string;
      endDate: string;
      assigneeEmail: string;
    }
  ) => void;
  onDelete: (id: string) => void;
}

export function CardModal({
  card,
  open,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [assigneeEmail, setAssigneeEmail] = useState("");

  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setDescription(card.description);
      setStartDate(card.startDate);
      setEndDate(card.endDate);
      setAssigneeEmail(card.assigneeEmail ?? "");
    }
  }, [card]);

  if (!open || !card) return null;

  return (
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-modal-title"
      >
        <h2 id="card-modal-title" className={styles.title}>
          Cartão
        </h2>
        <label className={styles.field}>
          Título
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={styles.input}
          />
        </label>
        <label className={styles.field}>
          Descrição
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={styles.textarea}
            rows={4}
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
            placeholder="nome@empresa.com"
          />
        </label>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.danger}
            onClick={() => {
              onDelete(card.id);
              onClose();
            }}
          >
            Excluir
          </button>
          <div className={styles.spacer} />
          <button type="button" className={styles.ghost} onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className={styles.primary}
            onClick={() => {
              onSave(card.id, {
                title: title.trim() || "Sem título",
                description: description.trim(),
                startDate,
                endDate,
                assigneeEmail: assigneeEmail.trim(),
              });
              onClose();
            }}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
