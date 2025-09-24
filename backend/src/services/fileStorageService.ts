class FileStorageService {
  constructor() {
    throw new Error('FileStorageService legacy non supportato. Utilizzare Prisma.');
  }
}

export const fileStorage = new FileStorageService();

