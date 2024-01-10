import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface WeatherDataResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  current_units: {
    time: string;
    interval: string;
    temperature_2m: string;
    precipitation: string;
  };
  current: {
    time: string;
    interval: number;
    temperature_2m: number;
    precipitation: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class WeatherService {

  constructor(private httpClient: HttpClient) { }

  public getWeatherData$(): Observable<WeatherDataResponse> {
    return new Observable(observer => {
      navigator.geolocation.getCurrentPosition((position) => {
        const weatherApiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&current=temperature_2m,precipitation,weather_code&timezone=auto`;

        this.httpClient.get<WeatherDataResponse>(weatherApiUrl, {observe: 'response'}).subscribe(response => {
          const data = response.body as WeatherDataResponse;
          console.log(response);
          observer.next(data);
        });
      });
    });
  }

}
