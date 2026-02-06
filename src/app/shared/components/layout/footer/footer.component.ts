import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
  phoneHai = '096654268';
  phoneHang = '0947927187';
  email = 'Quancn27@gmail.com';
  facebookUrl = 'https://www.facebook.com/hang.nguyen.thi.526333';
  address = 'Số nhà 86 Đường H28, Canh Nậu, Xã Tây Phương, Thành phố Hà Nội';
  mapUrl = 'https://www.google.com/maps/place/3J57%2B227,+Lam+S%C6%A1n,+Th%E1%BA%A1ch+Th%E1%BA%A5t,+H%C3%A0+N%E1%BB%99i,+Vi%E1%BB%87t+Nam/@21.0573829,105.6127367,19z/data=!4m9!1m2!2m1!1zM2o1NysyMjcgY2FuaCBu4bqtdSB0aOG6oWNoIHRo4bqldCBow6AgbuG7mWk!3m5!1s0x3134572313105841:0xd23605ef42f2f9ae!8m2!3d21.0575375!4d105.6125469!15sCiwzajU3KzIyNyBjYW5oIG7huq11IHRo4bqhY2ggdGjhuqV0IGjDoCBu4buZaZIBEGdlb2NvZGVkX2FkZHJlc3PgAQA?entry=ttu&g_ep=EgoyMDI2MDIwMy4wIKXMDSoASAFQAw%3D%3D';
  
  // Embed URL với tọa độ: 21.0575375, 105.6125469
  mapEmbedUrl: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) {
    const embedUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3723.1234567890!2d105.6125469!3d21.0575375!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3134572313105841%3A0xd23605ef42f2f9ae!2zM2o1NysyMjcgY2FuaCBu4bqtdSB0aOG6oWNoIHRo4bqldCBow6AgbuG7mWk!5e0!3m2!1svi!2s!4v1234567890!5m2!1svi!2s`;
    this.mapEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }
}
