import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { ChangePasswordComponent } from '../../../../shared/components/change-password/change-password.component';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';
import { SuperAdminService, SuperAdminResponse } from '../../services/super-admin.service';
import { PhoneInputComponent } from '../../../../shared/components/phone-input/phone-input.component';

@Component({
  selector: 'app-super-admin-settings',
  standalone: true,
  imports: [CommonModule, HeaderComponent, ReactiveFormsModule, ChangePasswordComponent, PhoneInputComponent],
  templateUrl: './super-admin-settings.component.html',
  styleUrl: './super-admin-settings.component.css'
})
export class SuperAdminSettingsComponent implements OnInit {
  profileForm!: FormGroup;
  profile: SuperAdminResponse | null = null;
  loading: boolean = true;

  countries: string[] = [
    'Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda','Argentina','Armenia','Australia','Austria','Azerbaijan',
    'Bahamas','Bahrain','Bangladesh','Barbados','Belarus','Belgium','Belize','Benin','Bhutan','Bolivia','Bosnia and Herzegovina','Botswana','Brazil','Brunei','Bulgaria','Burkina Faso','Burundi',
    'Cabo Verde','Cambodia','Cameroon','Canada','Central African Republic','Chad','Chile','China','Colombia','Comoros','Congo','Costa Rica','Croatia','Cuba','Cyprus','Czech Republic',
    'Denmark','Djibouti','Dominica','Dominican Republic',
    'East Timor','Ecuador','Egypt','El Salvador','Equatorial Guinea','Eritrea','Estonia','Eswatini','Ethiopia',
    'Fiji','Finland','France',
    'Gabon','Gambia','Georgia','Germany','Ghana','Greece','Grenada','Guatemala','Guinea','Guinea-Bissau','Guyana',
    'Haiti','Honduras','Hungary',
    'Iceland','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy',
    'Jamaica','Japan','Jordan',
    'Kazakhstan','Kenya','Kiribati','Kosovo','Kuwait','Kyrgyzstan',
    'Laos','Latvia','Lebanon','Lesotho','Liberia','Libya','Liechtenstein','Lithuania','Luxembourg',
    'Madagascar','Malawi','Malaysia','Maldives','Mali','Malta','Marshall Islands','Mauritania','Mauritius','Mexico','Micronesia','Moldova','Monaco','Mongolia','Montenegro','Morocco','Mozambique','Myanmar',
    'Namibia','Nauru','Nepal','Netherlands','New Zealand','Nicaragua','Niger','Nigeria','North Korea','North Macedonia','Norway',
    'Oman',
    'Pakistan','Palau','Palestine','Panama','Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal',
    'Qatar',
    'Romania','Russia','Rwanda',
    'Saint Kitts and Nevis','Saint Lucia','Saint Vincent and the Grenadines','Samoa','San Marino','Sao Tome and Principe','Saudi Arabia','Senegal','Serbia','Seychelles','Sierra Leone','Singapore','Slovakia','Slovenia','Solomon Islands','Somalia','South Africa','South Korea','South Sudan','Spain','Sri Lanka','Sudan','Suriname','Sweden','Switzerland','Syria',
    'Taiwan','Tajikistan','Tanzania','Thailand','Togo','Tonga','Trinidad and Tobago','Tunisia','Turkey','Turkmenistan','Tuvalu',
    'Uganda','Ukraine','United Arab Emirates','United Kingdom','United States','Uruguay','Uzbekistan',
    'Vanuatu','Vatican City','Venezuela','Vietnam',
    'Yemen',
    'Zambia','Zimbabwe'
  ];

  constructor(
    private fb: FormBuilder,
    private superAdminService: SuperAdminService,
    private confirmDialogService: ConfirmDialogService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  private initForm(): void {
    this.profileForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: [{ value: '', disabled: true }],
      contactNo: [''],
      country: ['']
    });
  }

  private loadProfile(): void {
    this.loading = true;
    this.superAdminService.getProfile().subscribe({
      next: (data) => {
        this.profile = data;
        const user = data.user;
        this.profileForm.patchValue({
          fullName: user.fullName || '',
          email: user.email || '',
          contactNo: user.contactNo || '',
          country: user.country || ''
        });
        this.loading = false;
      },
      error: (err) => {
        console.error("Failed to load profile", err);
        this.loading = false;
      }
    });
  }

  async onSave(): Promise<void> {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const payload = this.profileForm.getRawValue();
    // remove empty strings or disabled
    const updates = {
      fullName: payload.fullName,
      contactNo: payload.contactNo,
      country: payload.country
    };

    this.superAdminService.updateProfile(updates).subscribe({
      next: async (res) => {
        this.profile = res;
        await this.confirmDialogService.alert("Profile details successfully updated!");
      },
      error: async (err) => {
        await this.confirmDialogService.alert("Failed to update profile", "Error");
      }
    });
  }

  // Uses auth service automatically via component
  onPasswordChanged(event: any): void {
    // Password change logic handled by inner component
  }
}
