import { useState } from 'react';
import {
  AlertCircle,
  Armchair,
  Building2,
  Columns3,
  DoorOpen,
  Film,
  MapPin,
  PlusCircle,
  RotateCcw,
  Rows3,
  Save,
  Star,
  X,
} from 'lucide-react';
import {
  CINEMA_BRANCHES,
  ROOM_TECHNOLOGIES,
} from '../../../services/roomService';
import styles from './RoomForm.module.css';

// Hàm phụ: tạo danh sách chữ cái tên hàng từ số lượng hàng (VD: 8 -> ['A', 'B', ..., 'H'])
const generateRowLetters = (totalRows) => {
  let count = Number(totalRows);
  if (Number.isNaN(count) || count < 1) {
    return [];
  }
  if (count > 26) {
    count = 26;
  }

  let letters = [];
  for (let i = 0; i < count; i += 1) {
    const letter = String.fromCharCode(65 + i);
    letters = [...letters, letter];
  }
  return letters;
};

// Hàm phụ: ghép tên công nghệ vào tên phòng nếu người dùng chưa tự gõ (VD: "Phòng 06" -> "Phòng 06 - IMAX Laser")
const buildFinalRoomName = (rawName, technologyId) => {
  const cleanName = String(rawName || '').trim();
  const tech = ROOM_TECHNOLOGIES.find((item) => item.id === technologyId);

  if (!tech) {
    return cleanName;
  }

  // Nếu tên phòng đã có sẵn từ khóa công nghệ rồi thì giữ nguyên không ghép lặp
  const lowerName = cleanName.toLowerCase();
  const alreadyHasTech =
    lowerName.includes('imax') ||
    lowerName.includes('digital') ||
    lowerName.includes('dolby') ||
    lowerName.includes('vip') ||
    lowerName.includes('gold');

  if (alreadyHasTech) {
    return cleanName;
  }

  return `${cleanName} - ${tech.shortLabel}`;
};

// Hàm phụ: lấy dữ liệu khởi tạo cho Form (tạo mới hoặc chỉnh sửa phòng có sẵn)
const getInitialFormValues = (editingRoom) => {
  if (editingRoom) {
    return {
      name: editingRoom.name || '',
      branch: CINEMA_BRANCHES[0],
      technologyId: editingRoom.technologyId || ROOM_TECHNOLOGIES[0].id,
      totalRows: String(editingRoom.totalRows || 8),
      seatsPerRow: String(editingRoom.seatsPerRow || 12),
      vipRows: Array.isArray(editingRoom.vipRows)
        ? [...editingRoom.vipRows]
        : [],
      isActive:
        editingRoom.isActive !== undefined ? Boolean(editingRoom.isActive) : true,
    };
  }

  return {
    name: '',
    branch: CINEMA_BRANCHES[0],
    technologyId: ROOM_TECHNOLOGIES[0].id,
    totalRows: '8',
    seatsPerRow: '12',
    vipRows: ['D', 'E', 'F'],
    isActive: true,
  };
};

// Hàm phụ: kiểm tra hợp lệ các trường bắt buộc của Form
const validateRoomForm = (name, totalRows, seatsPerRow) => {
  const errors = {};

  if (name.trim().length < 2) {
    errors.name = 'Vui lòng nhập tên phòng chiếu (tối thiểu 2 ký tự).';
  }

  const rowsNum = Number(totalRows);
  if (
    !totalRows ||
    Number.isNaN(rowsNum) ||
    !Number.isInteger(rowsNum) ||
    rowsNum < 1 ||
    rowsNum > 26
  ) {
    errors.totalRows = 'Số hàng ghế phải là số nguyên từ 1 đến 26.';
  }

  const colsNum = Number(seatsPerRow);
  if (
    !seatsPerRow ||
    Number.isNaN(colsNum) ||
    !Number.isInteger(colsNum) ||
    colsNum < 1 ||
    colsNum > 30
  ) {
    errors.seatsPerRow = 'Số ghế mỗi hàng phải là số nguyên từ 1 đến 30.';
  }

  return errors;
};

// Component Form thêm mới / chỉnh sửa phòng chiếu (khớp ảnh giao diện mẫu)
const RoomForm = ({ editingRoom = null, onSubmitRoom, onCancelEdit }) => {
  const isEditMode = Boolean(editingRoom);
  const initialValues = getInitialFormValues(editingRoom);

  // Các state cơ bản tương ứng với từng ô nhập liệu trên form
  const [name, setName] = useState(initialValues.name);
  const [branch, setBranch] = useState(initialValues.branch);
  const [technologyId, setTechnologyId] = useState(initialValues.technologyId);
  const [totalRows, setTotalRows] = useState(initialValues.totalRows);
  const [seatsPerRow, setSeatsPerRow] = useState(initialValues.seatsPerRow);
  const [vipRows, setVipRows] = useState(initialValues.vipRows);

  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tạo danh sách các hàng ghế (A, B, C...) và tính nhanh tổng sức chứa
  const rowLetters = generateRowLetters(totalRows);
  const rowsNum = Number(totalRows) || 0;
  const colsNum = Number(seatsPerRow) || 0;
  const totalCapacity = rowsNum > 0 && colsNum > 0 ? rowsNum * colsNum : 0;

  // Chuỗi chú thích nhỏ bên phải ô Số hàng ghế (VD: "Từ A đến H (8 hàng)")
  let rowRangeHint = 'Nhập số hàng (1–26)';
  if (rowLetters.length > 0) {
    const lastLetter = rowLetters[rowLetters.length - 1];
    rowRangeHint = `Từ A đến ${lastLetter} (${rowLetters.length} hàng)`;
  }

  // Xóa lỗi của 1 trường khi người dùng gõ lại
  const clearError = (fieldName) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors({ ...fieldErrors, [fieldName]: '' });
    }
    if (submitError) {
      setSubmitError('');
    }
  };

  // Khi đổi số hàng ghế: tự loại bỏ các hàng VIP nằm ngoài phạm vi mới
  const handleTotalRowsChange = (event) => {
    const nextValue = event.target.value;
    setTotalRows(nextValue);
    clearError('totalRows');

    const validLetters = generateRowLetters(nextValue);
    const nextVipRows = vipRows.filter((letter) =>
      validLetters.includes(letter)
    );
    setVipRows(nextVipRows);
  };

  // Bật / tắt trạng thái VIP của 1 hàng ghế khi bấm vào nút chữ cái
  const handleToggleVipRow = (rowLetter) => {
    if (vipRows.includes(rowLetter)) {
      const updated = vipRows.filter((item) => item !== rowLetter);
      setVipRows(updated);
    } else {
      const updated = [...vipRows, rowLetter].sort();
      setVipRows(updated);
    }
  };

  // Làm mới toàn bộ form về trạng thái mặc định ban đầu
  const handleResetForm = () => {
    const defaults = getInitialFormValues(null);
    setName(defaults.name);
    setBranch(defaults.branch);
    setTechnologyId(defaults.technologyId);
    setTotalRows(defaults.totalRows);
    setSeatsPerRow(defaults.seatsPerRow);
    setVipRows(defaults.vipRows);
    setFieldErrors({});
    setSubmitError('');
  };

  // Xử lý bấm nút "+ Tạo phòng chiếu ngay" hoặc "Lưu thay đổi"
  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');

    // Bước 1: Kiểm tra hợp lệ dữ liệu nhập
    const errors = validateRoomForm(name, totalRows, seatsPerRow);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    // Bước 2: Chuẩn bị tên phòng kèm công nghệ và gọi hàm lưu của trang cha
    const finalName = buildFinalRoomName(name, technologyId);
    const currentIsActive = isEditMode ? editingRoom.isActive : true;

    setIsSubmitting(true);
    try {
      await onSubmitRoom({
        name: finalName,
        totalRows: Number(totalRows),
        seatsPerRow: Number(seatsPerRow),
        vipRows,
        isActive: currentIsActive,
      });

      if (!isEditMode) {
        handleResetForm();
      }
    } catch (error) {
      setSubmitError(
        error.message || 'Không thể lưu phòng chiếu. Vui lòng thử lại.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formHeading = isEditMode
    ? `Chỉnh sửa phòng chiếu: ${editingRoom.name}`
    : 'Thêm phòng chiếu mới';

  return (
    <section className={styles.formCard} aria-labelledby="room-form-heading">
      {/* Tiêu đề Form kèm icon */}
      <div className={styles.formHeader}>
        <div className={styles.titleBlock}>
          <div className={styles.headerIconBox} aria-hidden="true">
            <DoorOpen size={22} />
          </div>
          <div>
            <h2 id="room-form-heading" className={styles.formTitle}>
              {formHeading}
            </h2>
            <p className={styles.formSubtitle}>
              Thiết lập cấu hình sơ đồ ghế, sức chứa và phân bổ hàng VIP chuẩn
              hóa quy trình bán vé
            </p>
          </div>
        </div>

        {isEditMode && typeof onCancelEdit === 'function' && (
          <button
            type="button"
            onClick={onCancelEdit}
            className={styles.cancelEditBtn}
          >
            <X size={15} aria-hidden="true" />
            <span>Hủy chỉnh sửa</span>
          </button>
        )}
      </div>

      {/* Thông báo lỗi nghiệp vụ (VD: trùng tên phòng 409) */}
      {submitError && (
        <div className={styles.errorBanner} role="alert">
          <AlertCircle size={17} className={styles.errorIcon} aria-hidden="true" />
          <span>{submitError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.formBody} noValidate>
        {/* Hàng 1: Tên phòng chiếu, Cụm rạp chi nhánh, Công nghệ trình chiếu */}
        <div className={styles.gridRow3}>
          <div className={styles.fieldGroup}>
            <label htmlFor="room-name-input" className={styles.fieldLabel}>
              Tên phòng chiếu <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWithIcon}>
              <Building2 size={16} className={styles.leftIcon} aria-hidden="true" />
              <input
                id="room-name-input"
                type="text"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  clearError('name');
                }}
                placeholder="VD: Phòng 06"
                className={
                  fieldErrors.name
                    ? `${styles.fieldControl} ${styles.controlError}`
                    : styles.fieldControl
                }
              />
            </div>
            {fieldErrors.name && (
              <span className={styles.fieldError}>{fieldErrors.name}</span>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="room-branch-select" className={styles.fieldLabel}>
              Cụm rạp chi nhánh <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWithIcon}>
              <MapPin size={16} className={styles.leftIcon} aria-hidden="true" />
              <select
                id="room-branch-select"
                value={branch}
                onChange={(event) => setBranch(event.target.value)}
                className={styles.fieldControl}
              >
                {CINEMA_BRANCHES.map((branchName) => (
                  <option key={branchName} value={branchName}>
                    {branchName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="room-tech-select" className={styles.fieldLabel}>
              Công nghệ trình chiếu & Âm thanh{' '}
              <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWithIcon}>
              <Film size={16} className={styles.leftIcon} aria-hidden="true" />
              <select
                id="room-tech-select"
                value={technologyId}
                onChange={(event) => setTechnologyId(event.target.value)}
                className={styles.fieldControl}
              >
                {ROOM_TECHNOLOGIES.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.fullLabel}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Hàng 2: Số hàng ghế, Số ghế mỗi hàng, Ước tính công suất tự động */}
        <div className={styles.gridRow3}>
          <div className={styles.fieldGroup}>
            <div className={styles.labelRow}>
              <label htmlFor="room-rows-input" className={styles.fieldLabel}>
                Số hàng ghế <span className={styles.required}>*</span>
              </label>
              <span className={styles.labelHint}>{rowRangeHint}</span>
            </div>
            <div className={styles.inputWithIcon}>
              <Rows3 size={16} className={styles.leftIcon} aria-hidden="true" />
              <input
                id="room-rows-input"
                type="number"
                min="1"
                max="26"
                value={totalRows}
                onChange={handleTotalRowsChange}
                className={
                  fieldErrors.totalRows
                    ? `${styles.fieldControl} ${styles.controlError}`
                    : styles.fieldControl
                }
              />
            </div>
            {fieldErrors.totalRows && (
              <span className={styles.fieldError}>{fieldErrors.totalRows}</span>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <div className={styles.labelRow}>
              <label htmlFor="room-cols-input" className={styles.fieldLabel}>
                Số ghế mỗi hàng <span className={styles.required}>*</span>
              </label>
              <span className={styles.labelHint}>Số ghế trên 1 hàng</span>
            </div>
            <div className={styles.inputWithIcon}>
              <Columns3 size={16} className={styles.leftIcon} aria-hidden="true" />
              <input
                id="room-cols-input"
                type="number"
                min="1"
                max="30"
                value={seatsPerRow}
                onChange={(event) => {
                  setSeatsPerRow(event.target.value);
                  clearError('seatsPerRow');
                }}
                className={
                  fieldErrors.seatsPerRow
                    ? `${styles.fieldControl} ${styles.controlError}`
                    : styles.fieldControl
                }
              />
            </div>
            {fieldErrors.seatsPerRow && (
              <span className={styles.fieldError}>
                {fieldErrors.seatsPerRow}
              </span>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>Ước tính công suất tự động</span>
            <div className={styles.capacityBox}>
              <span className={styles.capacityLeft}>
                <Armchair
                  size={16}
                  className={styles.capacityIcon}
                  aria-hidden="true"
                />
                <span>Tổng sức chứa:</span>
              </span>
              <strong className={styles.capacityPill}>
                {totalCapacity} ghế
              </strong>
            </div>
          </div>
        </div>

        {/* Hàng 3: Khối chọn các hàng ghế VIP */}
        <div className={styles.vipBox}>
          <div className={styles.vipHeader}>
            <strong className={styles.vipTitle}>
              Chọn các hàng ghế VIP (Phụ thu phí dịch vụ cao cấp):
            </strong>
            <p className={styles.vipSubtitle}>
              Hàng ghế VIP nằm ở trục nhìn tối ưu trung tâm phòng chiếu
            </p>
          </div>

          {rowLetters.length > 0 ? (
            <div className={styles.vipButtonsWrap}>
              {rowLetters.map((letter) => {
                const isSelected = vipRows.includes(letter);
                const btnClass = isSelected
                  ? `${styles.vipRowBtn} ${styles.vipRowBtnActive}`
                  : styles.vipRowBtn;

                return (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => handleToggleVipRow(letter)}
                    className={btnClass}
                    aria-pressed={isSelected}
                  >
                    <span>Hàng {letter}</span>
                    {isSelected && (
                      <Star
                        size={12}
                        fill="currentColor"
                        className={styles.starIcon}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className={styles.vipEmptyHint}>
              Nhập số hàng ghế hợp lệ (1–26) để chọn hàng VIP.
            </p>
          )}
        </div>

        {/* Hàng 4: Nút Làm mới form & Tạo phòng chiếu ngay */}
        <div className={styles.actionsRow}>
          <button
            type="button"
            onClick={isEditMode ? onCancelEdit : handleResetForm}
            className={styles.resetBtn}
          >
            <RotateCcw size={15} aria-hidden="true" />
            <span>{isEditMode ? 'Hủy chỉnh sửa' : 'Làm mới form'}</span>
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className={styles.submitBtn}
          >
            {isEditMode ? (
              <>
                <Save size={16} aria-hidden="true" />
                <span>{isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
              </>
            ) : (
              <>
                <PlusCircle size={17} aria-hidden="true" />
                <span>
                  {isSubmitting ? 'Đang tạo...' : '+ Tạo phòng chiếu ngay'}
                </span>
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
};

export default RoomForm;