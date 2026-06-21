import { Component, OnInit } from '@angular/core';
import { LayoutService } from './service/app.layout.service';
import { AuthService } from '../core/services/auth.service';

@Component({
    selector: 'app-menu',
    templateUrl: './app.menu.component.html'
})
export class AppMenuComponent implements OnInit {

    model: any[] = [];

    constructor(
        public layoutService: LayoutService,
        private auth: AuthService
    ) {}

    ngOnInit() {
        const isAdmin = this.auth.isAdmin();

        // Items disponibles para TODOS los roles
        const itemsBase = [
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
        ];

        // Items exclusivos del ADMIN
        const itemsAdmin = [
            {
                label: 'RETIRADORES', icon: 'pi pi-fw pi-users',
                routerLink: ['/retiradores']
            },
            {
                label: 'CLIENTES', icon: 'pi pi-fw pi-id-card',
                routerLink: ['/clientes']
            },
            {
                label: 'CAMBIOS ARABES', icon: 'pi pi-fw pi-globe',
                routerLink: ['/cambios-arabes']
            },
            {
                label: 'ACTIVIDADES', icon: 'pi pi-fw pi-cog',
                routerLink: ['/actividades']
            },
            {
                label: 'HISTORIAL', icon: 'pi pi-fw pi-history',
                routerLink: ['/historial']
            },
        ];

        this.model = [
            {
                label: 'SECCIONES',
                items: isAdmin ? [...itemsBase, ...itemsAdmin] : itemsBase
            },
        ];
    }
}
