// src/app/services/s3.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  private apiUrl = 'http://localhost:3000/api/s3'; // 👈 cambia a tu backend en producción

  constructor(private http: HttpClient) {}

  /**
   * Subir archivo al backend, que luego lo manda a S3
   */
  async uploadFile(file: File, folder: string = 'products'): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const res: any = await firstValueFrom(
      this.http.post(`${this.apiUrl}/upload`, formData),
    );

    return res.url; // URL pública del archivo en S3
  }

  /**
   * Subida directa a S3 con Presigned URL
   */
 async uploadFilePresigned(file: File, folder: string = 'products'): Promise<string> {
  const presigned: any = await firstValueFrom(
    this.http.post(`${this.apiUrl}/presigned`, { filename: file.name, folder }),
  );

  await fetch(presigned.url, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });

  // ✅ URL pública final
  return `https://${this.extractBucketFromUrl(presigned.url)}.s3.${this.getRegionFromUrl(presigned.url)}.amazonaws.com/${presigned.key}`;
}

private extractBucketFromUrl(url: string): string {
  return url.split('.s3')[0].replace('https://', '');
}

private getRegionFromUrl(url: string): string {
  const match = url.match(/s3\.([^.]+)\.amazonaws/);
  return match ? match[1] : process.env['AWS_REGION'] || 'us-east-2';
}
}