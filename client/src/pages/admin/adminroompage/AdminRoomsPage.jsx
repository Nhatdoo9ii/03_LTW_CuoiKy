import { useState, useEffect } from 'react';
import {
  AlertCircle,
  Armchair,
  CheckCircle2,
  Edit3,
  Power,
  Search,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import RoomForm from '../../../components/tickets-admin/roomform/RoomForm';
import Pagination from '../../../components/common/Pagination';
import { useDebounce } from '../../../hooks/useDebounce';
import {
  ROOM_TECHNOLOGIES,
  createRoom,
  deleteRoom,
  getAllRooms,
  updateRoom,
} from '../../../services/roomService';
import styles from './AdminRoomsPage.module.css';

// Số thẻ phòng hiển thị tối đa trên mỗi trang
const ITEMS_PER_PAGE = 6;

// Trang Quản lý Phòng chiếu dành cho Admin (/admin/rooms)
const AdminRoomsPage = () => {
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  // State tìm kiếm, lọc theo công nghệ chiếu và phân trang
  const [searchText, setSearchText] = useState('');
  const [techFilter, setTechFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // State quản lý phòng đang chỉnh sửa, trạng thái đang đổi bảo trì, modal xóa và thông báo nhanh
  const [editingRoom, setEditingRoom] = useState(null);
  const [togglingRoomId, setTogglingRoomId] = useState(null);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Dùng custom hook useDebounce có sẵn để tránh lọc liên tục khi đang gõ
  const debouncedSearch = useDebounce(searchText, 300);

  // Bước 1: Gọi API lấy danh sách phòng chiếu khi mở trang
  useEffect(() => {
    let isCancelled = false;

    const loadRooms = async () => {
      try {
        const list = await getAllRooms();
        if (!isCancelled) {
          setRooms(list);
          setPageError('');
        }
      } catch (error) {
        if (!isCancelled) {
          setPageError(error.message || 'Không thể tải danh sách phòng chiếu.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadRooms();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Bước 2: Tự động tắt thông báo toast sau 3.5 giây (có cleanup clearTimeout)
  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timerId = setTimeout(() => {
      setToastMessage('');
    }, 3500);

    return () => {
      clearTimeout(timerId);
    };
  }, [toastMessage]);

  // Bước 3: Tính 4 số liệu thống kê hiển thị cạnh tiêu đề bằng vòng lặp cơ bản
  let activeCount = 0;
  let maintenanceCount = 0;
  let totalSeatsAllRooms = 0;

  for (const room of rooms) {
    if (room.isActive) {
      activeCount = activeCount + 1;
    } else {
      maintenanceCount = maintenanceCount + 1;
    }
    totalSeatsAllRooms = totalSeatsAllRooms + (Number(room.totalSeats) || 0);
  }

  // Bước 4: Lọc danh sách phòng theo tên tìm kiếm và công nghệ trình chiếu
  const cleanKeyword = debouncedSearch.trim().toLowerCase();

  const filteredRooms = rooms.filter((room) => {
    if (techFilter !== 'all' && room.technologyId !== techFilter) {
      return false;
    }

    if (cleanKeyword) {
      const roomName = String(room.name || '').toLowerCase();
      if (!roomName.includes(cleanKeyword)) {
        return false;
      }
    }

    return true;
  });

  // Bước 5: Phân trang danh sách phòng sau khi lọc
  const totalPages = Math.max(
    1,
    Math.ceil(filteredRooms.length / ITEMS_PER_PAGE)
  );
  let safeCurrentPage = currentPage;
  if (safeCurrentPage > totalPages) {
    safeCurrentPage = totalPages;
  }

  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedRooms = filteredRooms.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  // Xử lý thay đổi tìm kiếm và bộ lọc công nghệ
  const handleSearchChange = (event) => {
    setSearchText(event.target.value);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchText('');
    setCurrentPage(1);
  };

  const handleTechFilterChange = (event) => {
    setTechFilter(event.target.value);
    setCurrentPage(1);
  };

  // Xử lý tạo phòng mới hoặc lưu cập nhật phòng đang sửa
  const handleSubmitRoom = async (formValues) => {
    if (editingRoom) {
      const updated = await updateRoom(editingRoom.id, formValues);
      const nextList = rooms.map((item) => {
        if (String(item.id) === String(editingRoom.id)) {
          return updated;
        }
        return item;
      });

      setRooms(nextList);
      setEditingRoom(null);
      setToastMessage(`Đã cập nhật thành công "${updated.name}"`);
      return;
    }

    const created = await createRoom(formValues);
    setRooms([...rooms, created]);
    setTechFilter('all');
    setToastMessage(`Đã tạo mới thành công "${created.name}"`);
  };

  // Bắt đầu chỉnh sửa 1 phòng và cuộn lên đầu trang nơi đặt Form
  const handleStartEdit = (room) => {
    setEditingRoom(room);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingRoom(null);
  };

  // Bật / tắt nhanh trạng thái Bảo trì ngay trên từng thẻ phòng
  const handleToggleMaintenance = async (room) => {
    setTogglingRoomId(room.id);
    setPageError('');

    try {
      const nextIsActive = !room.isActive;
      const updated = await updateRoom(room.id, {
        name: room.name,
        totalRows: room.totalRows,
        seatsPerRow: room.seatsPerRow,
        vipRows: room.vipRows,
        isActive: nextIsActive,
      });

      const nextList = rooms.map((item) => {
        if (String(item.id) === String(room.id)) {
          return updated;
        }
        return item;
      });

      setRooms(nextList);

      if (nextIsActive) {
        setToastMessage(`Đã mở hoạt động trở lại cho "${room.name}"`);
      } else {
        setToastMessage(`Đã chuyển "${room.name}" sang trạng thái Bảo trì`);
      }
    } catch (error) {
      setPageError(
        error.message || 'Không thể thay đổi trạng thái phòng chiếu.'
      );
    } finally {
      setTogglingRoomId(null);
    }
  };

  // Mở modal xác nhận xóa phòng
  const handleOpenDeleteModal = (room) => {
    setDeleteError('');
    setRoomToDelete(room);
  };

  // Thực hiện xóa phòng chiếu sau khi Admin bấm xác nhận
  const handleConfirmDelete = async () => {
    if (!roomToDelete) {
      return;
    }

    setDeleteError('');
    try {
      await deleteRoom(roomToDelete.id);
      const remaining = rooms.filter((item) => {
        return String(item.id) !== String(roomToDelete.id);
      });

      setRooms(remaining);

      if (editingRoom && String(editingRoom.id) === String(roomToDelete.id)) {
        setEditingRoom(null);
      }

      setToastMessage(`Đã xóa phòng chiếu "${roomToDelete.name}"`);
      setRoomToDelete(null);
    } catch (error) {
      setDeleteError(
        error.message || 'Không thể xóa phòng chiếu này. Vui lòng thử lại.'
      );
    }
  };

  // Key giúp RoomForm tự nạp lại dữ liệu khi chuyển giữa chế độ Tạo mới và Chỉnh sửa
  const formKey = editingRoom ? `edit-${editingRoom.id}` : 'create-room';

  return (
    <section className={styles.pageWrapper}>
      {/* Thông báo nhanh khi thao tác thành công */}
      {toastMessage && (
        <div className={styles.toastBanner} role="status">
          <CheckCircle2 size={18} aria-hidden="true" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Thông báo lỗi chung nếu có */}
      {pageError && (
        <div className={styles.errorBanner} role="alert">
          <AlertCircle size={18} aria-hidden="true" />
          <span>{pageError}</span>
        </div>
      )}

      {/* 1. TIÊU ĐỀ TRANG & 4 VIÊN THUỐC THỐNG KÊ NHANH (GIỐNG ẢNH MẪU) */}
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Quản lý Phòng chiếu</h1>

        <div className={styles.statPills}>
          <span className={styles.statPill}>
            Tổng số:{' '}
            <strong className={styles.pillPrimaryText}>
              {rooms.length} phòng
            </strong>
          </span>

          <span className={styles.statPill}>
            <span className={`${styles.statusDot} ${styles.dotGreen}`} />
            <span>{activeCount} Hoạt động</span>
          </span>

          <span className={styles.statPill}>
            <span className={`${styles.statusDot} ${styles.dotOrange}`} />
            <span>{maintenanceCount} Bảo trì</span>
          </span>

          <span className={styles.statPill}>
            <Armchair size={14} className={styles.pillIcon} aria-hidden="true" />
            <span>{totalSeatsAllRooms} ghế tổng cộng</span>
          </span>
        </div>
      </header>

      {/* 2. FORM THÊM / CHỈNH SỬA PHÒNG CHIẾU */}
      <RoomForm
        key={formKey}
        editingRoom={editingRoom}
        onSubmitRoom={handleSubmitRoom}
        onCancelEdit={handleCancelEdit}
      />

      {/* 3. KHU VỰC DANH SÁCH PHÒNG CHIẾU HIỆN HÀNH (DẠNG LƯỚI THẺ 2 CỘT) */}
      <section className={styles.listSection} aria-label="Danh sách phòng chiếu hiện hành">
        <div className={styles.listHeader}>
          <h2 className={styles.listTitle}>Danh sách phòng chiếu hiện hành</h2>

          <div className={styles.listControls}>
            <div className={styles.searchBox}>
              <Search size={15} className={styles.searchIcon} aria-hidden="true" />
              <label htmlFor="search-rooms-input" className={styles.srOnly}>
                Tìm tên phòng chiếu
              </label>
              <input
                id="search-rooms-input"
                type="text"
                value={searchText}
                onChange={handleSearchChange}
                placeholder="Tìm tên phòng chiếu..."
                className={styles.searchInput}
              />
              {searchText && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className={styles.clearSearchBtn}
                  aria-label="Xóa từ khóa tìm kiếm"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              )}
            </div>

            <label htmlFor="filter-room-tech" className={styles.srOnly}>
              Lọc theo công nghệ trình chiếu
            </label>
            <select
              id="filter-room-tech"
              value={techFilter}
              onChange={handleTechFilterChange}
              className={styles.techFilterSelect}
            >
              <option value="all">Tất cả công nghệ</option>
              {ROOM_TECHNOLOGIES.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.shortLabel}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Trạng thái đang tải / danh sách rỗng / lưới thẻ phòng */}
        {isLoading ? (
          <div className={styles.emptyBox}>
            <p>Đang tải danh sách phòng chiếu...</p>
          </div>
        ) : paginatedRooms.length === 0 ? (
          <div className={styles.emptyBox}>
            <p className={styles.emptyTitle}>
              Không tìm thấy phòng chiếu nào phù hợp.
            </p>
            <p className={styles.emptySub}>
              Hãy thử đổi bộ lọc công nghệ, xóa từ khóa tìm kiếm hoặc tạo phòng
              mới ở form phía trên.
            </p>
          </div>
        ) : (
          <div className={styles.cardsGrid}>
            {paginatedRooms.map((room, index) => {
              const displayNumber = String(startIndex + index + 1).padStart(
                2,
                '0'
              );
              const vipList = Array.isArray(room.vipRows) ? room.vipRows : [];
              const vipSeatCount = vipList.length * room.seatsPerRow;

              const isBeingEdited =
                editingRoom && String(editingRoom.id) === String(room.id);
              const isToggling = String(togglingRoomId) === String(room.id);

              let vipSummaryText = '0 ghế (Chưa có)';
              if (vipList.length > 0) {
                vipSummaryText = `${vipSeatCount} ghế (Hàng ${vipList.join(',')})`;
              }

              let cardClass = styles.roomCard;
              if (isBeingEdited) {
                cardClass = `${styles.roomCard} ${styles.roomCardEditing}`;
              }

              return (
                <article key={room.id} className={cardClass}>
                  {/* Phần đầu thẻ: Trạng thái, Tên phòng, Số thứ tự 01/02/03 */}
                  <div className={styles.cardTop}>
                    <div className={styles.cardTitleGroup}>
                      <span
                        className={
                          room.isActive
                            ? `${styles.statusBadge} ${styles.statusActive}`
                            : `${styles.statusBadge} ${styles.statusMaintenance}`
                        }
                      >
                        • {room.isActive ? 'Đang hoạt động' : 'Đang bảo trì'}
                      </span>
                      <h3 className={styles.roomName}>{room.name}</h3>
                    </div>

                    <span className={styles.numberBadge}>{displayNumber}</span>
                  </div>

                  {/* 3 Ô thông số: Cấu hình, Sức chứa, Ghế VIP */}
                  <div className={styles.metricsGrid}>
                    <div className={styles.metricBox}>
                      <span className={styles.metricLabel}>CẤU HÌNH</span>
                      <strong className={styles.metricValue}>
                        {room.totalRows} hàng × {room.seatsPerRow} ghế
                      </strong>
                    </div>

                    <div className={styles.metricBox}>
                      <span className={styles.metricLabel}>SỨC CHỨA</span>
                      <strong className={styles.metricValue}>
                        {room.totalSeats} ghế (
                        {room.isActive ? 'Đang mở' : 'Bảo trì'})
                      </strong>
                    </div>

                    <div className={styles.metricBox}>
                      <span className={styles.metricLabel}>GHẾ VIP</span>
                      <strong className={styles.metricValueVip}>
                        {vipSummaryText}
                      </strong>
                    </div>
                  </div>

                  {/* Hàng phân bố các hàng ghế VIP */}
                  <div className={styles.vipRowList}>
                    <span className={styles.vipRowLabel}>Phân bố VIP:</span>
                    {vipList.length > 0 ? (
                      <div className={styles.vipTags}>
                        {vipList.map((rowLetter) => (
                          <span key={rowLetter} className={styles.vipTag}>
                            Hàng {rowLetter}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className={styles.noVipText}>Chưa cấu hình</span>
                    )}
                  </div>

                  {/* 3 Nút thao tác nhanh: Sửa, Bảo trì/Mở lại, Xóa */}
                  <div className={styles.cardActions}>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(room)}
                      className={styles.actionBtn}
                    >
                      <Edit3 size={14} aria-hidden="true" />
                      <span>Sửa</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleMaintenance(room)}
                      disabled={isToggling}
                      className={
                        room.isActive
                          ? `${styles.actionBtn} ${styles.maintenanceBtn}`
                          : `${styles.actionBtn} ${styles.activateBtn}`
                      }
                    >
                      {room.isActive ? (
                        <>
                          <Wrench size={14} aria-hidden="true" />
                          <span>{isToggling ? 'Đang lưu...' : 'Bảo trì'}</span>
                        </>
                      ) : (
                        <>
                          <Power size={14} aria-hidden="true" />
                          <span>{isToggling ? 'Đang lưu...' : 'Mở lại'}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenDeleteModal(room)}
                      className={`${styles.actionBtn} ${styles.deleteBtn}`}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                      <span>Xóa</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Thanh phân trang tái sử dụng từ components/common/Pagination.jsx */}
        <div className={styles.paginationWrap}>
          <Pagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            onPageChange={(nextPage) => setCurrentPage(nextPage)}
          />
        </div>
      </section>

      {/* Modal xác nhận xóa phòng chiếu */}
      {roomToDelete && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setRoomToDelete(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-room-modal-title"
        >
          <div
            className={styles.modalBox}
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="delete-room-modal-title" className={styles.modalTitle}>
              Xác nhận xóa phòng chiếu?
            </h2>
            <p className={styles.modalDesc}>
              Bạn có chắc chắn muốn xóa phòng chiếu này khỏi hệ thống không?
            </p>

            <div className={styles.modalInfoBox}>
              <p>
                <strong>Tên phòng:</strong> {roomToDelete.name}
              </p>
              <p>
                <strong>Cấu hình:</strong> {roomToDelete.totalRows} hàng ×{' '}
                {roomToDelete.seatsPerRow} ghế ({roomToDelete.totalSeats} ghế)
              </p>
            </div>

            {deleteError && (
              <div className={styles.modalError} role="alert">
                <AlertCircle size={16} aria-hidden="true" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelModalBtn}
                onClick={() => setRoomToDelete(null)}
              >
                Đóng
              </button>
              <button
                type="button"
                className={styles.confirmDeleteBtn}
                onClick={handleConfirmDelete}
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default AdminRoomsPage;