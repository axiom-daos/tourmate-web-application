import {Component} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';
import {MatIconModule} from '@angular/material/icon';

/**
 * About view for the shared presentation context.
 */
@Component({
  selector: 'app-about',
  imports: [
    TranslatePipe,
    MatIconModule
  ],
  templateUrl: './about.html',
  styleUrl: './about.css'
})
export class About {

}
