/**
 * Dữ liệu Tỉnh/Thành phố và Quận/Huyện của Việt Nam
 * Hỗ trợ Combobox lựa chọn địa chỉ giao nhận hàng.
 */

export interface ProvinceLocation {
  id: string;
  name: string;
  districts: string[];
}

export const VIETNAM_LOCATIONS: ProvinceLocation[] = [
  {
    id: "hanoi",
    name: "Hà Nội",
    districts: [
      "Ba Đình", "Hoàn Kiếm", "Tây Hồ", "Long Biên", "Cầu Giấy", "Đống Đa",
      "Hai Bà Trưng", "Hoàng Mai", "Thanh Xuân", "Sóc Sơn", "Đông Anh", "Gia Lâm",
      "Nam Từ Liêm", "Bắc Từ Liêm", "Thanh Trì", "Mê Linh", "Hà Đông", "Sơn Tây",
      "Ba Vì", "Phúc Thọ", "Đan Phượng", "Hoài Đức", "Quốc Oai", "Thạch Thất",
      "Chương Mỹ", "Thanh Oai", "Thường Tín", "Phú Xuyên", "Ứng Hòa", "Mỹ Đức",
    ],
  },
  {
    id: "hcm",
    name: "TP Hồ Chí Minh",
    districts: [
      "Quận 1", "Quận 3", "Quận 4", "Quận 5", "Quận 6", "Quận 7", "Quận 8",
      "Quận 10", "Quận 11", "Quận 12", "Bình Tân", "Bình Thạnh", "Gò Vấp",
      "Phú Nhuận", "Tân Bình", "Tân Phú", "TP Thủ Đức", "Bình Chánh", "Cần Giờ",
      "Củ Chi", "Hóc Môn", "Nhà Bè",
    ],
  },
  {
    id: "danang",
    name: "Đà Nẵng",
    districts: [
      "Hải Châu", "Thanh Khê", "Sơn Trà", "Ngũ Hành Sơn", "Liên Chiểu",
      "Cẩm Lệ", "Hòa Vang", "Hoàng Sa",
    ],
  },
  {
    id: "haiphong",
    name: "Hải Phòng",
    districts: [
      "Hồng Bàng", "Ngô Quyền", "Lê Chân", "Hải An", "Kiến An", "Đồ Sơn",
      "Dương Kinh", "An Dương", "An Lão", "Kiến Thụy", "Thủy Nguyên",
      "Tiên Lãng", "Vĩnh Bảo", "Cát Hải", "Bạch Long Vĩ",
    ],
  },
  {
    id: "cantho",
    name: "Cần Thơ",
    districts: [
      "Ninh Kiều", "Ô Môn", "Bình Thủy", "Cái Răng", "Thốt Nốt",
      "Vĩnh Thạnh", "Cờ Đỏ", "Phong Điền", "Thới Lai",
    ],
  },
  {
    id: "angiang",
    name: "An Giang",
    districts: ["Long Xuyên", "Châu Đốc", "An Phú", "Tân Châu", "Phú Tân", "Châu Phú", "Tịnh Biên", "Tri Tôn", "Châu Thành", "Chợ Mới", "Thoại Sơn"],
  },
  {
    id: "baria-vungtau",
    name: "Bà Rịa - Vũng Tàu",
    districts: ["Vũng Tàu", "Bà Rịa", "Phú Mỹ", "Châu Đức", "Côn Đảo", "Đất Đỏ", "Long Điền", "Xuyên Mộc"],
  },
  {
    id: "bacgiang",
    name: "Bắc Giang",
    districts: ["Bắc Giang", "Hiệp Hòa", "Lạng Giang", "Lục Nam", "Lục Ngạn", "Sơn Động", "Tân Yên", "Việt Yên", "Yên Dũng", "Yên Thế"],
  },
  {
    id: "backan",
    name: "Bắc Kạn",
    districts: ["Bắc Kạn", "Ba Bể", "Bạch Thông", "Chợ Đồn", "Chợ Mới", "Na Rì", "Ngân Sơn", "Pác Nặm"],
  },
  {
    id: "baclieu",
    name: "Bạc Liêu",
    districts: ["Bạc Liêu", "Giá Rai", "Đông Hải", "Hòa Bình", "Hồng Dân", "Phước Long", "Vĩnh Lợi"],
  },
  {
    id: "bacninh",
    name: "Bắc Ninh",
    districts: ["Bắc Ninh", "Từ Sơn", "Gia Bình", "Lương Tài", "Quế Võ", "Thuận Thành", "Tiên Du", "Yên Phong"],
  },
  {
    id: "bentre",
    name: "Bến Tre",
    districts: ["Bến Tre", "Ba Tri", "Bình Đại", "Châu Thành", "Chợ Lách", "Giồng Trôm", "Mỏ Cày Bắc", "Mỏ Cày Nam", "Thạnh Phú"],
  },
  {
    id: "binhdinh",
    name: "Bình Định",
    districts: ["Quy Nhơn", "An Nhơn", "Hoài Nhơn", "An Lão", "Hoài Ân", "Phù Cát", "Phù Mỹ", "Tây Sơn", "Tuy Phước", "Vân Canh", "Vĩnh Thạnh"],
  },
  {
    id: "binhduong",
    name: "Bình Dương",
    districts: ["Thủ Dầu Một", "Bến Cát", "Dĩ An", "Tân Uyên", "Thuận An", "Bắc Tân Uyên", "Bàu Bàng", "Dầu Tiếng", "Phú Giáo"],
  },
  {
    id: "binhphuoc",
    name: "Bình Phước",
    districts: ["Đồng Xoài", "Bình Long", "Phước Long", "Bù Đăng", "Bù Đốp", "Bù Gia Mập", "Chơn Thành", "Đồng Phú", "Hớn Quản", "Lộc Ninh", "Phú Riềng"],
  },
  {
    id: "binhthuan",
    name: "Bình Thuận",
    districts: ["Phan Thiết", "La Gi", "Bắc Bình", "Đức Linh", "Hàm Tân", "Hàm Thuận Bắc", "Hàm Thuận Nam", "Phú Quý", "Tánh Linh", "Tuy Phong"],
  },
  {
    id: "camau",
    name: "Cà Mau",
    districts: ["Cà Mau", "Cái Nước", "Đầm Dơi", "Năm Căn", "Ngọc Hiển", "Phú Tân", "Thới Bình", "Trần Văn Thời", "U Minh"],
  },
  {
    id: "caobang",
    name: "Cao Bằng",
    districts: ["Cao Bằng", "Bảo Lạc", "Bảo Lâm", "Hạ Lang", "Hà Quảng", "Hòa An", "Nguyên Bình", "Quảng Hòa", "Thạch An", "Trùng Khánh"],
  },
  {
    id: "daklak",
    name: "Đắk Lắk",
    districts: ["Buôn Ma Thuột", "Buôn Hồ", "Buôn Đôn", "Cư Kuin", "Cư M'gar", "Ea H'leo", "Ea Kar", "Ea Súp", "Krông Ana", "Krông Bông", "Krông Búk", "Krông Năng", "Krông Pắc", "Lắk", "M'Đrắk"],
  },
  {
    id: "daknong",
    name: "Đắk Nông",
    districts: ["Gia Nghĩa", "Cư Jút", "Đắk Glong", "Đắk Mil", "Đắk R'lấp", "Đắk Song", "Krông Nô", "Tuy Đức"],
  },
  {
    id: "dienbien",
    name: "Điện Biên",
    districts: ["Điện Biên Phủ", "Mường Lay", "Điện Biên", "Điện Biên Đông", "Mường Ảng", "Mường Chà", "Mường Nhé", "Nậm Pồ", "Tủa Chùa", "Tuần Giáo"],
  },
  {
    id: "dongnai",
    name: "Đồng Nai",
    districts: ["Biên Hòa", "Long Khánh", "Cẩm Mỹ", "Định Quán", "Long Thành", "Nhơn Trạch", "Tân Phú", "Thống Nhất", "Trảng Bom", "Vĩnh Cửu", "Xuân Lộc"],
  },
  {
    id: "dongthap",
    name: "Đồng Tháp",
    districts: ["Cao Lãnh", "Sa Đéc", "Hồng Ngự", "Châu Thành", "Lai Vung", "Lấp Vò", "Tam Nông", "Tân Hồng", "Thanh Bình", "Tháp Mười"],
  },
  {
    id: "gialai",
    name: "Gia Lai",
    districts: ["Pleiku", "An Khê", "Ayun Pa", "Chư Păh", "Chư Prông", "Chư Pưh", "Chư Sê", "Đak Đoa", "Đak Pơ", "Đức Cơ", "Ia Grai", "Ia Pa", "Kbang", "Kông Chro", "Krông Pa", "Mang Yang", "Phú Thiện"],
  },
  {
    id: "hagiang",
    name: "Hà Giang",
    districts: ["Hà Giang", "Bắc Mê", "Bắc Quang", "Đồng Văn", "Hoàng Su Phì", "Mèo Vạc", "Quản Bạ", "Quang Bình", "Vị Xuyên", "Xín Mần", "Yên Minh"],
  },
  {
    id: "hanam",
    name: "Hà Nam",
    districts: ["Phủ Lý", "Duy Tiên", "Bình Lục", "Kim Bảng", "Lý Nhân", "Thanh Liêm"],
  },
  {
    id: "hatinh",
    name: "Hà Tĩnh",
    districts: ["Hà Tĩnh", "Hồng Lĩnh", "Kỳ Anh", "Cẩm Xuyên", "Can Lộc", "Đức Thọ", "Hương Khê", "Hương Sơn", "Lộc Hà", "Nghi Xuân", "Thạch Hà", "Vũ Quang"],
  },
  {
    id: "haiduong",
    name: "Hải Dương",
    districts: ["Hải Dương", "Chí Linh", "Kinh Môn", "Bình Giang", "Cẩm Giàng", "Gia Lộc", "Kim Thành", "Nam Sách", "Ninh Giang", "Thanh Hà", "Thanh Miện", "Tứ Kỳ"],
  },
  {
    id: "haugiang",
    name: "Hậu Giang",
    districts: ["Vị Thanh", "Ngã Bảy", "Châu Thành", "Châu Thành A", "Long Mỹ", "Phụng Hiệp", "Vị Thủy"],
  },
  {
    id: "hoabinh",
    name: "Hòa Bình",
    districts: ["Hòa Bình", "Cao Phong", "Đà Bắc", "Kim Bôi", "Lạc Sơn", "Lạc Thủy", "Lương Sơn", "Mai Châu", "Tân Lạc", "Yên Thủy"],
  },
  {
    id: "hungyen",
    name: "Hưng Yên",
    districts: ["Hưng Yên", "Mỹ Hào", "Ân Thi", "Khoái Châu", "Kim Động", "Phù Cừ", "Tiên Lữ", "Văn Giang", "Văn Lâm", "Yên Mỹ"],
  },
  {
    id: "khanhhoa",
    name: "Khánh Hòa",
    districts: ["Nha Trang", "Cam Ranh", "Ninh Hòa", "Cam Lâm", "Diên Khánh", "Khánh Sơn", "Khánh Vĩnh", "Trường Sa", "Vạn Ninh"],
  },
  {
    id: "kiengiang",
    name: "Kiên Giang",
    districts: ["Rạch Giá", "Hà Tiên", "Phú Quốc", "An Biên", "An Minh", "Châu Thành", "Giang Thành", "Giồng Riềng", "Gò Quao", "Hòn Đất", "Kiên Hải", "Kiên Lương", "Tân Hiệp", "U Minh Thượng", "Vĩnh Thuận"],
  },
  {
    id: "kontum",
    name: "Kon Tum",
    districts: ["Kon Tum", "Đắk Glei", "Đắk Hà", "Đắk Tô", "Ia H'Drai", "Kon Plông", "Kon Rẫy", "Ngọc Hồi", "Sa Thầy", "Tu Mơ Rông"],
  },
  {
    id: "laichau",
    name: "Lai Châu",
    districts: ["Lai Châu", "Mường Tè", "Nậm Nhùn", "Phong Thổ", "Sìn Hồ", "Tam Đường", "Tân Uyên", "Than Uyên"],
  },
  {
    id: "lamdong",
    name: "Lâm Đồng",
    districts: ["Đà Lạt", "Bảo Lộc", "Bảo Lâm", "Cát Tiên", "Di Linh", "Đạ Huoai", "Đạ Tẻh", "Đam Rông", "Đơn Dương", "Đức Trọng", "Lạc Dương", "Lâm Hà"],
  },
  {
    id: "langson",
    name: "Lạng Sơn",
    districts: ["Lạng Sơn", "Bắc Sơn", "Bình Gia", "Cao Lộc", "Chi Lăng", "Đình Lập", "Hữu Lũng", "Lộc Bình", "Tràng Định", "Văn Lãng", "Văn Quan"],
  },
  {
    id: "laocai",
    name: "Lào Cai",
    districts: ["Lào Cai", "Sa Pa", "Bát Xát", "Bảo Thắng", "Bảo Yên", "Bắc Hà", "Mường Khương", "Si Ma Cai", "Văn Bàn"],
  },
  {
    id: "longan",
    name: "Long An",
    districts: ["Tân An", "Kiến Tường", "Bến Lức", "Cần Đước", "Cần Giuộc", "Châu Thành", "Đức Hòa", "Đức Huệ", "Mộc Hóa", "Tân Hưng", "Tân Thạnh", "Tân Trụ", "Thạnh Hóa", "Thủ Thừa", "Vĩnh Hưng"],
  },
  {
    id: "namdinh",
    name: "Nam Định",
    districts: ["Nam Định", "Giao Thủy", "Hải Hậu", "Mỹ Lộc", "Nam Trực", "Nghĩa Hưng", "Trực Ninh", "Vụ Bản", "Xuân Trường", "Ý Yên"],
  },
  {
    id: "nghean",
    name: "Nghệ An",
    districts: ["Vinh", "Cửa Lò", "Hoàng Mai", "Thái Hòa", "Anh Sơn", "Con Cuông", "Diễn Châu", "Đô Lương", "Hưng Nguyên", "Kỳ Sơn", "Nam Đàn", "Nghi Lộc", "Nghĩa Đàn", "Quế Phong", "Quỳ Châu", "Quỳ Hợp", "Quỳnh Lưu", "Tân Kỳ", "Thanh Chương", "Tương Dương", "Yên Thành"],
  },
  {
    id: "ninhbinh",
    name: "Ninh Bình",
    districts: ["Ninh Bình", "Tam Điệp", "Gia Viễn", "Hoa Lư", "Kim Sơn", "Nho Quan", "Yên Khánh", "Yên Mô"],
  },
  {
    id: "ninhthuan",
    name: "Ninh Thuận",
    districts: ["Phan Rang - Tháp Chàm", "Bác Ái", "Ninh Hải", "Ninh Phước", "Ninh Sơn", "Thuận Bắc", "Thuận Nam"],
  },
  {
    id: "phutho",
    name: "Phú Thọ",
    districts: ["Việt Trì", "Phú Thọ", "Cẩm Khê", "Đoan Hùng", "Hạ Hòa", "Lâm Thao", "Phù Ninh", "Tam Nông", "Tân Sơn", "Thanh Ba", "Thanh Sơn", "Thanh Thủy", "Yên Lập"],
  },
  {
    id: "phuyen",
    name: "Phú Yên",
    districts: ["Tuy Hòa", "Sông Cầu", "Đông Hòa", "Đồng Xuân", "Phú Hòa", "Sơn Hòa", "Sông Hinh", "Tây Hòa", "Tuy An"],
  },
  {
    id: "quangbinh",
    name: "Quảng Bình",
    districts: ["Đồng Hới", "Ba Đồn", "Bố Trạch", "Lệ Thủy", "Minh Hóa", "Quảng Ninh", "Quảng Trạch", "Tuyên Hóa"],
  },
  {
    id: "quangnam",
    name: "Quảng Nam",
    districts: ["Tam Kỳ", "Hội An", "Điện Bàn", "Bắc Trà My", "Đại Lộc", "Đông Giang", "Duy Xuyên", "Hiệp Đức", "Nam Giang", "Nam Trà My", "Nông Sơn", "Núi Thành", "Phú Ninh", "Phước Sơn", "Quế Sơn", "Tây Giang", "Thăng Bình", "Tiên Phước"],
  },
  {
    id: "quangngai",
    name: "Quảng Ngãi",
    districts: ["Quảng Ngãi", "Đức Phổ", "Ba Tơ", "Bình Sơn", "Lý Sơn", "Minh Long", "Mộ Đức", "Nghĩa Hành", "Sơn Hà", "Sơn Tây", "Sơn Tịnh", "Trà Bồng", "Tư Nghĩa"],
  },
  {
    id: "quangninh",
    name: "Quảng Ninh",
    districts: ["Hạ Long", "Cẩm Phả", "Móng Cái", "Uông Bí", "Đông Triều", "Quảng Yên", "Ba Chẽ", "Bình Liêu", "Cô Tô", "Đầm Hà", "Hải Hà", "Tiên Yên", "Vân Đồn"],
  },
  {
    id: "quangtri",
    name: "Quảng Trị",
    districts: ["Đông Hà", "Quảng Trị", "Cam Lộ", "Cồn Cỏ", "Đakrông", "Gio Linh", "Hải Lăng", "Hướng Hóa", "Triệu Phong", "Vĩnh Linh"],
  },
  {
    id: "soctrang",
    name: "Sóc Trăng",
    districts: ["Sóc Trăng", "Ngã Năm", "Vĩnh Châu", "Châu Thành", "Cù Lao Dung", "Kế Sách", "Long Phú", "Mỹ Tú", "Mỹ Xuyên", "Thạnh Trị", "Trần Đề"],
  },
  {
    id: "sonla",
    name: "Sơn La",
    districts: ["Sơn La", "Bắc Yên", "Mai Sơn", "Mộc Châu", "Mường La", "Phù Yên", "Quỳnh Nhai", "Sông Mã", "Sốp Cộp", "Thuận Châu", "Vân Hồ", "Yên Châu"],
  },
  {
    id: "tayninh",
    name: "Tây Ninh",
    districts: ["Tây Ninh", "Hòa Thành", "Trảng Bàng", "Bến Cầu", "Châu Thành", "Dương Minh Châu", "Gò Dầu", "Tân Biên", "Tân Châu"],
  },
  {
    id: "thaibinh",
    name: "Thái Bình",
    districts: ["Thái Bình", "Đông Hưng", "Hưng Hà", "Kiến Xương", "Quỳnh Phụ", "Thái Thụy", "Tiền Hải", "Vũ Thư"],
  },
  {
    id: "thainguyen",
    name: "Thái Nguyên",
    districts: ["Thái Nguyên", "Sông Công", "Phổ Yên", "Đại Từ", "Định Hóa", "Đồng Hỷ", "Phú Bình", "Phú Lương", "Võ Nhai"],
  },
  {
    id: "thanhhoa",
    name: "Thanh Hóa",
    districts: ["Thanh Hóa", "Bỉm Sơn", "Sầm Sơn", "Nghi Sơn", "Bá Thước", "Cẩm Thủy", "Đông Sơn", "Hà Trung", "Hậu Lộc", "Hoằng Hóa", "Lang Chánh", "Mường Lát", "Nga Sơn", "Ngọc Lặc", "Như Thanh", "Như Xuân", "Nông Cống", "Quan Hóa", "Quan Sơn", "Quảng Xương", "Thạch Thành", "Thiệu Hóa", "Thọ Xuân", "Thường Xuân", "Triệu Sơn", "Vĩnh Lộc", "Yên Định"],
  },
  {
    id: "thuathienhue",
    name: "Thừa Thiên Huế",
    districts: ["Huế", "Hương Thủy", "Hương Trà", "A Lưới", "Nam Đông", "Phong Điền", "Phú Lộc", "Phú Vang", "Quảng Điền"],
  },
  {
    id: "tiengiang",
    name: "Tiền Giang",
    districts: ["Mỹ Tho", "Gò Công", "Cai Lậy", "Cái Bè", "Châu Thành", "Chợ Gạo", "Gò Công Đông", "Gò Công Tây", "Tân Phú Đông", "Tân Phước"],
  },
  {
    id: "travinh",
    name: "Trà Vinh",
    districts: ["Trà Vinh", "Duyên Hải", "Càng Long", "Cầu Kè", "Cầu Ngang", "Châu Thành", "Tiểu Cần", "Trà Cú"],
  },
  {
    id: "tuyenquang",
    name: "Tuyên Quang",
    districts: ["Tuyên Quang", "Chiêm Hóa", "Hàm Yên", "Lâm Bình", "Na Hang", "Sơn Dương", "Yên Sơn"],
  },
  {
    id: "vinhlong",
    name: "Vĩnh Long",
    districts: ["Vĩnh Long", "Bình Minh", "Bình Tân", "Long Hồ", "Mang Thít", "Tam Bình", "Trà Ôn", "Vũng Liêm"],
  },
  {
    id: "vinhphuc",
    name: "Vĩnh Phúc",
    districts: ["Vĩnh Yên", "Phúc Yên", "Bình Xuyên", "Lập Thạch", "Sông Lô", "Tam Đảo", "Tam Dương", "Vĩnh Tường", "Yên Lạc"],
  },
  {
    id: "yenbai",
    name: "Yên Bái",
    districts: ["Yên Bái", "Nghĩa Lộ", "Lục Yên", "Mù Cang Chải", "Trạm Tấu", "Trấn Yên", "Văn Chấn", "Văn Yên", "Yên Bình"],
  },
];

/** Lấy danh sách tên Tỉnh/Thành */
export function getProvinces(): string[] {
  return VIETNAM_LOCATIONS.map((loc) => loc.name);
}

/** Lấy danh sách Quận/Huyện theo tên Tỉnh/Thành */
export function getDistrictsByProvince(provinceName: string): string[] {
  const normalized = provinceName.trim().toLowerCase();
  const found = VIETNAM_LOCATIONS.find(
    (loc) => loc.name.toLowerCase() === normalized
  );
  return found ? found.districts : [];
}
