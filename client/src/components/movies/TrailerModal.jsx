import styles from './TrailerModal.module.css';

function TrailerModal({ isOpen, title, trailerUrl, onClose }) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Trailer: {title}</h3>
          <button
            type="button"
            className={styles.closeModalBtn}
            onClick={onClose}
            aria-label="Đóng trailer"
          >
            ✕
          </button>
        </div>
        <div className={styles.videoWrapper}>
          <iframe
            src={trailerUrl}
            title={`Trailer ${title}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}

export default TrailerModal;