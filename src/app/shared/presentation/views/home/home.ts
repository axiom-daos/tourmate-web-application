import {Component} from '@angular/core';
import {RouterLink} from '@angular/router';
import {MatIconModule} from '@angular/material/icon';
import {TranslatePipe} from '@ngx-translate/core';

/**
 * Home view for the shared presentation context.
 */
@Component({
  selector: 'app-home',
  imports: [TranslatePipe, RouterLink, MatIconModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {

}
