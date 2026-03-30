import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-student-enrollment-chart',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: './student-enrollment-chart.component.html',
  styleUrls: ['./student-enrollment-chart.component.css']
})
export class StudentEnrollmentChartComponent implements OnChanges {
  @Input() subjects: string[] = ['Math101', 'HistoryT201', 'CS101', 'English'];
  @Input() enrollments: number[] = [25, 22, 20, 30];

  barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: this.subjects,
    datasets: [
      {
        label: 'Enrolled Students',
        data: this.enrollments,
        backgroundColor: '#4f46e5',
        hoverBackgroundColor: '#3730a3',
        borderRadius: 4,
        maxBarThickness: 50,
      },
    ],
  };
  barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: { color: '#1e3a8a' },
      },
    },
    scales: {
      x: {
        ticks: { color: '#1e3a8a' },
      },
      y: {
        beginAtZero: true,
        ticks: { color: '#1e3a8a' },
      },
    },
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['subjects'] || changes['enrollments']) {
      this.barChartData = {
        labels: this.subjects,
        datasets: [
          {
            label: 'Enrolled Students',
            data: this.enrollments,
            backgroundColor: '#4f46e5',
            hoverBackgroundColor: '#3730a3',
            borderRadius: 4,
            maxBarThickness: 50,
          },
        ],
      };
    }
  }
}
