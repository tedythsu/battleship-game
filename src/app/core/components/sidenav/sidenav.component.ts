import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidenavService } from '../../services/sidenav.service';
import { RouterModule } from '@angular/router';
import { WeatherService, WeatherDataResponse } from '../../services/weather.service';

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss'
})
export class SidenavComponent implements OnInit {

  constructor(
    private sidenav: SidenavService,
    private weatherService: WeatherService
  ) {}

  weatherData: WeatherDataResponse = {
    latitude: 0,
    longitude: 0,
    generationtime_ms: 0,
    utc_offset_seconds: 0,
    timezone: '',
    timezone_abbreviation: '',
    elevation: 0,
    current_units: {
      time: '',
      interval: '',
      temperature_2m: '',
      precipitation: ''
    },
    current: {
      time: '',
      interval: 0,
      temperature_2m: 0,
      precipitation: 0
    }
  };

  ngOnInit(): void {
    this.getWeatherData();
  }

  private getWeatherData() {
    this.weatherService.$getWeatherData().subscribe(
      (data: WeatherDataResponse) => {
        this.weatherData = data;
      }
    )
  }

  get isSidenavOpen() {
    return this.sidenav.isSidenavOpen;
  }
}
