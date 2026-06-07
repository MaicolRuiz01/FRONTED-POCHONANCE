import { OnInit } from '@angular/core';
import { Component } from '@angular/core';
import { LayoutService } from './service/app.layout.service';

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
                        label: 'P2P', icon: 'pi pi-fw pi-bitcoin',
                        routerLink: ['/p2p']
                    },
                    {
                        label: 'MOVIMIENTOS', icon: 'pi pi-fw pi-arrow-right-arrow-left',
                        routerLink: ['/movimientos']
                    },
                ]
            },
        ];
    }
}
