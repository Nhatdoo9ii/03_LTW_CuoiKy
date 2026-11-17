import HeroBanner from "../../components/movies/HeroBanner";
import MovieCard from "../../components/movies/MovieCard";
import MovieFilterBar from "../../components/movies/MovieFilterBar";
import styles from './HomePage.module.css';
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
        genres: ['Hoạt Hình', 'Phiêu Lưu', 'Gia Đình'],
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
        genres: ['Hoạt Hình', 'Hài Hước', 'Thiếu Nhi'],
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
        id: 'm6',
        title: 'Vượt Giới Hạn Không Gian',
        director: 'Denis Villeneuve',
        actors: 'Timothée Chalamet, Zendaya',
        genres: ['Viễn Tưởng', 'Phiêu Lưu'],
        duration: 148,
        ageRating: 'T13',
        format: 'IMAX 3D',
        rating: '9.5',
        status: 'coming-soon',
        posterUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=600&q=80',
    },
];
const HomePage = () => (

    <div>
        <HeroBanner />

        <MovieFilterBar />

        <div className={styles.movieGrid}>
            {SAMPLE_MOVIES.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
            ))}
        </div>


    </div>
);
export default HomePage