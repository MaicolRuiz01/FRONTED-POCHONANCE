import { OnInit } from '@angular/core';
import { Component } from '@angular/core';
import { LayoutService } from './service/app.layout.service';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-menu',
    templateUrl: './app.menu.component.html'
})
export class AppMenuComponent implements OnInit {

    model: any[] = [];

    constructor(public layoutService: LayoutService) { }

    ngOnInit() {
        this.model = [
            {
                label: 'Home',
                items: [
                    { label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/'] }
                ]
            },
            {
                label: 'SECCIONES DE LA APLICACION',
                items: [
                  {
                       label: 'SALDOS', icon: 'pi pi-fw pi-wallet',
                       routerLink: ['/saldos']
                  },
                    {
                      label: 'ASIGNAR', icon: 'pi pi-fw pi-address-book',
                      routerLink: ['/asignaciones']
                  },
                  {
                    label: 'ACTIVIDADES', icon: 'pi pi-fw pi-clock',
                    routerLink: ['/actividades']
                },

                {
                    label: 'TRUST', icon : 'pi pi-fw pi-ethereum',
                    routerLink: ['/trust']
                }

                   /*  {
                        label: 'CRIPTOS', icon: 'pi pi-fw pi-bitcoin',

                                routerLink: ['/cripto']

                    } */

                ]
            },

        ];
    }
}
