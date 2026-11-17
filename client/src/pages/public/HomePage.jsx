import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import HeroBanner from '../../components/movies/HeroBanner';
import MovieFilterBar from '../../components/movies/MovieFilterBar';
import MovieCard from '../../components/movies/MovieCard';
import Pagination from '../../components/common/Pagination';
import styles from './HomePage.module.css';

// Dữ liệu mẫu tạm thời (sau này thay bằng gọi API)
const SAMPLE_MOVIES = [
    {
        id: 'm1',
        title: 'Chiến Dịch Bóng Đêm: Tái Đấu',
        director: 'Christopher McQuarrie',
        actors: 'Tom Cruise, Rebecca Ferguson',
        genres: ['Hành Động', 'Điệp Viên'],
        duration: 135,
        ageRating: 'T18',
        format: 'IMAX Laser',
        rating: '9.6',
        status: 'now-showing',
        posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
    },
    {
        id: 'm2',
        title: 'Vương Quốc Diệu Kỳ & Xứ Sở Phép Thuật',
        director: 'Chris Buck',
        actors: 'Ariana DeBose, Chris Pine',
        genres: ['Hoạt Hình', 'Phiêu Lưu'],
        duration: 95,
        ageRating: 'P',
        format: '3D Phụ đề',
        rating: '9.6',
        status: 'now-showing',
        posterUrl: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?auto=format&fit=crop&w=600&q=80',
    },
    {
        id: 'm3',
        title: 'Chú Thỏ Siêu Phàm: Cứu Thế Giới',
        director: 'Ben Stassen',
        actors: 'Thomas Solivéres, Chloé Jouannet',
        genres: ['Hoạt Hình', 'Hài Hước'],
        duration: 92,
        ageRating: 'P',
        format: '2D Lồng tiếng',
        rating: '9.0',
        status: 'now-showing',
        posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    },
    {
        id: 'm4',
        title: 'Tiếng Thì Thầm Trong Đêm',
        director: 'Lee Chung-hyun',
        actors: 'Park Shin-hye, Jeon Jong-seo',
        genres: ['Kinh Dị', 'Tâm Lý'],
        duration: 108,
        ageRating: 'T16',
        format: '2D Digital',
        rating: '8.8',
        status: 'now-showing',
        posterUrl: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?auto=format&fit=crop&w=600&q=80',
    },
    {
        id: 'm5',
        title: 'Đường Đua Sinh Tử: Đỉnh Cao Tốc Độ',
        director: 'Joseph Kosinski',
        actors: 'Brad Pitt, Damson Idris',
        genres: ['Hành Động', 'Thể Thao'],
        duration: 142,
        ageRating: 'T16',
        format: 'IMAX 2D',
        rating: '9.4',
        status: 'now-showing',
        posterUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=600&q=80',
    },
    {
        id: 'm6',
        title: 'Bản Giao Hưởng Mùa Hạ',
        director: 'Makoto Shinkai',
        actors: 'Nanoka Hara, Hokuto Matsumura',
        genres: ['Hoạt Hình', 'Tình Cảm'],
        duration: 122,
        ageRating: 'P',
        format: '2D Phụ đề',
        rating: '9.3',
        status: 'now-showing',
        posterUrl: 'https://images.unsplash.com/photo-1513106580091-1d82408b8cd6?auto=format&fit=crop&w=600&q=80',
    },
    {
        id: 'm7',
        title: 'Mật Mã Đỏ: Giải Cứu Bầu Trời',
        director: 'Antoine Fuqua',
        actors: 'Denzel Washington, Dakota Fanning',
        genres: ['Hành Động', 'Hình Sự'],
        duration: 119,
        ageRating: 'T18',
        format: '2D Digital',
        rating: '8.9',
        status: 'now-showing',
        posterUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=600&q=80',
    },
    {
        id: 'm8',
        title: 'Ngôi Làng Sương Mù',
        director: 'Jang Jae-hyun',
        actors: 'Choi Min-sik, Kim Go-eun',
        genres: ['Kinh Dị', 'Bí Ẩn'],
        duration: 134,
        ageRating: 'T18',
        format: '2D Phụ đề',
        rating: '9.1',
        status: 'now-showing',
        posterUrl: 'https://images.unsplash.com/photo-1505635552518-3448ff116af3?auto=format&fit=crop&w=600&q=80',
    },
    {
        id: 'm9',
        title: 'Chuyến Tàu Xuyên Ký Ức',
        director: 'Trấn Thành',
        actors: 'Tuấn Trần, Phương Anh Đào',
        genres: ['Tình Cảm', 'Hài Hước'],
        duration: 128,
        ageRating: 'T16',
        format: '2D Digital',
        rating: '8.7',
        status: 'now-showing',
        posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80',
    },
    {
        id: 'm10',
        title: 'Hành Tinh Cát: Đế Chế Trỗi Dậy',
        director: 'Denis Villeneuve',
        actors: 'Timothée Chalamet, Zendaya',
        genres: ['Viễn Tưởng', 'Hành Động'],
        duration: 166,
        ageRating: 'T16',
        format: 'IMAX Laser',
        rating: '9.7',
        status: 'now-showing',
        posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
    },

    {
        id: 'm11',
        title: 'Hẹn Ước Mùa Thu Hà Nội',
        director: 'Victor Vũ',
        actors: 'Kaity Nguyễn, Thuận Nguyễn',
        genres: ['Tình Cảm', 'Lãng Mạn'],
        duration: 118,
        ageRating: 'T13',
        format: '2D Digital',
        rating: '9.2',
        status: 'coming-soon',
        posterUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=600&q=80',
    },
    {
        id: 'm12',
        title: 'Vượt Giới Hạn Không Gian',
        director: 'Christopher Nolan',
        actors: 'Cillian Murphy, Matt Damon',
        genres: ['Viễn Tưởng', 'Phiêu Lưu'],
        duration: 148,
        ageRating: 'T13',
        format: 'IMAX 3D',
        rating: '9.5',
        status: 'coming-soon',
        posterUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=600&q=80',
    },
    {
        id: 'm13',
        title: 'Biệt Đội Mèo Siêu Quậy',
        director: 'Mark Dindal',
        actors: 'Chris Pratt, Samuel L. Jackson',
        genres: ['Hoạt Hình', 'Hài Hước'],
        duration: 101,
        ageRating: 'P',
        format: '2D Lồng tiếng',
        rating: '8.9',
        status: 'coming-soon',
        posterUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80',
    },
    {
        id: 'm14',
        title: 'Bóng Ma Nhà Hát Cổ',
        director: 'James Wan',
        actors: 'Patrick Wilson, Vera Farmiga',
        genres: ['Kinh Dị', 'Siêu Nhiên'],
        duration: 115,
        ageRating: 'T18',
        format: '2D Phụ đề',
        rating: '9.0',
        status: 'coming-soon',
        posterUrl: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&w=600&q=80',
    },
    {
        id: 'm15',
        title: 'Cú Đấm Thép: Hồi Kết',
        director: 'Chad Stahelski',
        actors: 'Keanu Reeves, Donnie Yen',
        genres: ['Hành Động', 'Võ Thuật'],
        duration: 150,
        ageRating: 'T18',
        format: 'IMAX 2D',
        rating: '9.5',
        status: 'coming-soon',
        posterUrl: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&w=600&q=80',
    },
    {
        id: 'm16',
        title: 'Kỳ Nghỉ Bất Ổn Tại Đà Lạt',
        director: 'Lý Hải',
        actors: 'Quốc Trường, Mạc Văn Khoa',
        genres: ['Hài Hước', 'Gia Đình'],
        duration: 112,
        ageRating: 'P',
        format: '2D Digital',
        rating: '8.6',
        status: 'coming-soon',
        posterUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=600&q=80',
    },
];

function HomePage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeStatus = searchParams.get('status') || 'now-showing';

    // State bộ lọc
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGenre, setSelectedGenre] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const itemsPerPage = 4;

    // Lọc danh sách phim theo tab (Đang chiếu / Sắp chiếu) và bộ lọc tìm kiếm
    const filteredMovies = useMemo(() => {
        return SAMPLE_MOVIES.filter((movie) => {
            const matchStatus = movie.status === activeStatus;
            const keyword = searchTerm.toLowerCase().trim();
            const matchKeyword =
                !keyword ||
                movie.title.toLowerCase().includes(keyword) ||
                movie.director.toLowerCase().includes(keyword) ||
                movie.actors.toLowerCase().includes(keyword);
            const matchGenre =
                !selectedGenre || movie.genres.includes(selectedGenre);

            return matchStatus && matchKeyword && matchGenre;
        });
    }, [activeStatus, searchTerm, selectedGenre]);

    const totalPages = Math.ceil(filteredMovies.length / itemsPerPage);
    const paginatedMovies = filteredMovies.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleTabChange = (status) => {
        setCurrentPage(1);
        if (status === 'now-showing') {
            setSearchParams({});
        } else {
            setSearchParams({ status });
        }
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setSelectedGenre('');
        setSelectedDate('');
        setCurrentPage(1);
    };

    return (
        <div className={styles.pageContainer}>
            <HeroBanner />

            <MovieFilterBar
                searchTerm={searchTerm}
                onSearchChange={(val) => {
                    setSearchTerm(val);
                    setCurrentPage(1);
                }}
                selectedGenre={selectedGenre}
                onGenreChange={(val) => {
                    setSelectedGenre(val);
                    setCurrentPage(1);
                }}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                onFilterSubmit={() => setCurrentPage(1)}
                onReset={handleResetFilters}
            />

            {/* Thanh chuyển nhanh Phim Đang Chiếu / Phim Sắp Chiếu */}
            <div className={styles.sectionHeader}>
                <div className={styles.tabs}>
                    <button
                        type="button"
                        className={`${styles.tabBtn} ${activeStatus === 'now-showing' ? styles.activeTab : ''
                            }`}
                        onClick={() => handleTabChange('now-showing')}
                    >
                        Phim Đang Chiếu
                    </button>
                    <button
                        type="button"
                        className={`${styles.tabBtn} ${activeStatus === 'coming-soon' ? styles.activeTab : ''
                            }`}
                        onClick={() => handleTabChange('coming-soon')}
                    >
                        Phim Sắp Chiếu
                    </button>
                </div>

                <span className={styles.resultCount}>
                    Hiển thị <strong>{filteredMovies.length}</strong> bộ phim
                </span>
            </div>

            {paginatedMovies.length > 0 ? (
                <div className={styles.movieGrid}>
                    {paginatedMovies.map((movie) => (
                        <MovieCard key={movie.id} movie={movie} />
                    ))}
                </div>
            ) : (
                <div className={styles.emptyState}>
                    <p>Không tìm thấy bộ phim nào phù hợp với từ khóa hoặc bộ lọc hiện tại.</p>
                    <button
                        type="button"
                        onClick={handleResetFilters}
                        className={styles.emptyResetBtn}
                    >
                        Xem tất cả phim
                    </button>
                </div>
            )}

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
            />
        </div>
    );
}

export default HomePage;