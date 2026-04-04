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

  private readonly barColor = '#23A997';
  private readonly barHoverColor = '#1b8c7d';
  private readonly axisColor = '#64748b';
  private readonly gridColor = 'rgba(148, 163, 184, 0.18)';

  barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: this.subjects,
    datasets: [
      {
        label: 'Enrolled Students',
        data: this.enrollments,
        backgroundColor: this.barColor,
        hoverBackgroundColor: this.barHoverColor,
        borderRadius: 4,
        maxBarThickness: 50,
      },
    ],
  };
  barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: { color: this.axisColor },
      },
    },
    scales: {
      x: {
        ticks: { color: this.axisColor },
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: { color: this.axisColor },
        grid: {
          color: this.gridColor,
          drawBorder: false,
        },
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
            backgroundColor: this.barColor,
            hoverBackgroundColor: this.barHoverColor,
            borderRadius: 4,
            maxBarThickness: 50,
          },
        ],
      };
    }
  }
}
