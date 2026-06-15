export interface Post {
  _id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  location: {
    provinceName: string;
    provinceCode?: string;
    wardName?: string;
    wardCode?: string;
  };
  seller?: {
    _id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface CreatePostData {
  title: string;
  description: string;
  price: number;
  category: string;
  location: {
    provinceName: string;
    provinceCode: string;
    wardName: string;
    wardCode: string;
  };
  images: string[];
}

export interface UpdatePostData extends Partial<CreatePostData> {
  _id: string;
}
