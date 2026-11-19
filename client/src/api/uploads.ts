import { api } from './client';

export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const uploadsApi = {
  // Sends the file to our API, which checks it and stores it in S3
  photo(file: File, folder: 'services' | 'barbers') {
    const form = new FormData();
    form.append('photo', file);
    return api.upload<{ url: string }>(`/uploads/image?folder=${folder}`, form).then((r) => r.url);
  },
};
