import {Component} from '@angular/core';
import {Layout} from './shared/presentation/components/layout/layout';

/** Root component that hosts the shared application shell. */
@Component({
  selector: 'app-root',
  imports: [Layout],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
}
