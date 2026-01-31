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
            /* {
                label: 'Home',
                items: [
                    { label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/'] }
                ]
            }, */
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
                  /* {
                    label: 'ASIGNADAS', icon: 'pi pi-fw pi-check-square',
                    routerLink: ['/historial']
                
                  }, */
                  
                  /* {
                    label: 'ACTIVIDADES', icon: 'pi pi-fw pi-clock',
                    routerLink: ['/actividades']
                }, */
                {
                    label: 'MOVIMIENTOS', icon: 'pi pi-fw pi-arrow-right-arrow-left',
                    routerLink: ['/movimientos']
                },
                /* {
                    label: 'CLIENTES', icon: 'pi pi-fw pi-users',
                    routerLink: ['/clientes']
                }, */
               /*  {
                    label: 'CAMBIOS ARABES', icon: 'pi pi-fw pi-exchange-alt',
                    routerLink: ['/cambios-arabes']
                } */

                

                   /*  {
                        label: 'CRIPTOS', icon: 'pi pi-fw pi-bitcoin',

                                routerLink: ['/cripto']

                    } */

                ]
            },

        ];
    }
}
