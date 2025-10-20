// src/app/services/s3.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  private readonly apiUrl = `${environment.apiUrl}/s3`; // 👈 cambia a tu backend en producción

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
async uploadFilePresigned(file: File, folder: string): Promise<string> {
  // 1. Pedís al back un presigned URL
  const res = await firstValueFrom(
    this.http.post<{ key: string; url: string }>(
      `${this.apiUrl}/presigned`, // 👈 usa apiUrl
      { filename: file.name, folder }
    )
  );

  if (!res || !res.key || !res.url) {
    throw new Error('No se pudo obtener la URL firmada de S3');
  }

  // 2. Subís el archivo a S3 con fetch/PUT
  await fetch(res.url, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type
    }
  });

  // 3. Retornás la URL pública
  return `https://${environment.AWS_S3_BUCKET}.s3.${environment.AWS_REGION}.amazonaws.com/${res.key}`;
}


private extractBucketFromUrl(url: string): string {
  return url.split('.s3')[0].replace('https://', '');
}

private getRegionFromUrl(url: string): string {
  const match = url.match(/s3\.([^.]+)\.amazonaws/);
  return match ? match[1] : process.env['AWS_REGION'] || 'us-east-2';
}
}