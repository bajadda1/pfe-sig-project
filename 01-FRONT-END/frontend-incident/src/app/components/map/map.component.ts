import {AfterViewInit, Component} from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-fullscreen';
import 'leaflet.locatecontrol';
import 'leaflet-control-geocoder';
import 'leaflet.markercluster';
import {RegionsService} from '../../services/territoriale-service/regions.service';
import {ProvincesService} from '../../services/territoriale-service/provinces.service';
import {MapService} from '../../services/map-service/map-service.service';
import {RegionDTO} from '../../models/region';
import {ProvinceDTO} from '../../models/province';
import {SectorDTO} from '../../models/sector';
import {TypeDTO} from '../../models/type';
import {IncidentService} from '../../services/incident-service/incident.service';
import {SectorService} from '../../services/sector-service/sector.service';
import {TypeService} from '../../services/type-service/type.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
  standalone: false
})
export class MapComponent implements AfterViewInit {
  private regionsLayer = L.layerGroup();
  private provincesLayer = L.layerGroup();
  private markersLayer = L.layerGroup();
  // @ts-ignore
  private markerClusterGroup:MarkerClusterGroup<any> = L.markerClusterGroup();

  filters = {
    status: '',
    regionId: null,
    provinceId: null,
    sectorId: null,
    typeId: null,
    description: null,
    startDate: null,
    endDate: null
  };


  //===========Filter attributes
  selectedStatus: string = ''; // Default filter
  selectedProvince = null;
  selectedRegion = null;
  selectedSector: number | null = null;
  selectedType = null;
  selectedStartDate = '';
  selectedEndDate = '';
  searchTerm = '';

  statusOptions = ['DECLARED', 'PUBLISHED', 'REJECTED', 'IN_PROGRESS', 'PROCESSED', 'BLOCKED'];

  regions:RegionDTO[] = [];
  provinces:ProvinceDTO[] = [];
  sectors:SectorDTO[] = [];
  types:TypeDTO[] = [];

  constructor(
    private regionsService: RegionsService,
    private provincesService: ProvincesService,
    private mapService: MapService,
    private incidentService:IncidentService,
    private sectorService: SectorService,
    private typeService: TypeService,
  ) {
  }

  ngAfterViewInit(): void {

    // @ts-ignore

    this.markerClusterGroup = L.markerClusterGroup({

      iconCreateFunction: (cluster: { getChildCount: () => any; }) => {
        return L.divIcon({
          html: `<div style="
        background-color: orange;
        color: white;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        line-height: 30px;
        text-align: center;
        font-weight: bold;
        box-shadow: 0 0 2px rgba(0,0,0,0.5);
      ">${cluster.getChildCount()}</div>`,
          className: '',
          iconSize: [30, 30]
        });
      }
    });


    const map = this.mapService.initializeMap('map', {
      center: [51.505, -0.09],
      zoom: 13,
    });


    const esriMapLayer = this.mapService.createTileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      'Tiles &copy; Esri &mdash; GIS User Community'
    );


    const satelliteLayer = this.mapService.createTileLayer(
      'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
      '© Stamen Design, under CC BY 3.0. Map data © OpenStreetMap contributors'
    );

    // Set the default tile layer (e.g., Esri Map Layer)
    this.mapService.addLayersControl(
      map,
      {
        'Esri Map Layer': esriMapLayer,
        Satellite: satelliteLayer,
      },
      {
        Regions: this.regionsLayer,
        Provinces: this.provincesLayer,
      },
      //default base layer
      esriMapLayer
    );

    this.mapService.addScaleControl(map);
    this.mapService.locateUser(map); // Enable geolocation
    this.mapService.addGeocoder(map); // Enable geocoder for search
    this.loadRegions();
    this.getRegions();
    this.getProvinces();
    this.getSectors();
    this.getTypes();
    this.loadProvinces();
    this.loadIncidents()


    // @ts-ignore
    L.control.legend({
      position: 'bottom',
      legends: [
        { label: 'DECLARED', type: 'circle', color: 'orange' },
        { label: 'PUBLISHED', type: 'circle', color: 'green' },
        { label: 'REJECTED', type: 'circle', color: 'red' },
        { label: 'IN_PROGRESS', type: 'circle', color: 'blue' },
        { label: 'PROCESSED', type: 'circle', color: 'purple' },
        { label: 'BLOCKED', type: 'circle', color: 'gray' },
      ],
    })
    .addTo(map);

  }


  private loadRegions(): void {
    this.regionsService.getRegions().subscribe((regions) => {
      regions.forEach((region: any) => {
        const polygons = this.mapService.addPolygon(
          this.mapService.getMap(),
          region.geom,
          { color: 'blue', weight: 2, fillOpacity: 0.5 },
          this.regionsLayer
        );
        polygons.forEach(p => {
          p.bindPopup(`<b>${region.name}</b><br>Area: ${region.area}`);
        });
      });
    });
  }

  private loadProvinces(): void {
    this.provincesService.getProvinces().subscribe((provinces) => {
      provinces.forEach((province: any) => {
        const polygons = this.mapService.addPolygon(
          this.mapService.getMap(),
          province.geom,
          { color: 'blue', weight: 2, fillOpacity: 0.5 },
          this.provincesLayer
        );
        polygons.forEach(p => {
          p.bindPopup(`<b>${province.name}</b><br>Area: ${province.area}`);
        });
      });
    });
  }


  resetFilters() {
    this.selectedStatus = '';
    this.selectedRegion = null;
    this.selectedProvince = null;
    this.selectedSector = null;
    this.selectedType = null;
    this.selectedStartDate = '';
    this.selectedEndDate = '';
    this.searchTerm = '';
    this.loadIncidents();
  }


  // called on init or after filter
  loadIncidents(): void {
    this.markerClusterGroup.clearLayers();

    this.incidentService.getAllFilteredIncidents({
      status: this.selectedStatus,
      provinceId: this.selectedProvince,
      regionId: this.selectedRegion,
      sectorId: this.selectedSector,
      typeId: this.selectedType,
      description: this.searchTerm,
      startDate: this.selectedStartDate,
      endDate: this.selectedEndDate
    }).subscribe((incidents) => {
      incidents.forEach(incident => {
        const point = this.mapService.parseWktPoint(incident.location);
        if (point) {
          const icon = this.getMarkerIconByStatus(incident.status);
          const marker = L.marker(point, { icon }).bindPopup(`
          <strong>${incident.description}</strong><br>
          Status: ${incident.status}<br>
          Type: ${incident.typeDTO?.name || ''}
        `);
          this.markerClusterGroup.addLayer(marker);
        }
      });

      this.markerClusterGroup.addTo(this.mapService.getMap()!);
    });
  }

  getMarkerIconByStatus(status: string): L.DivIcon {
    const colorMap: Record<string, string> = {
      DECLARED: '#FFA726',
      PUBLISHED: '#66BB6A',
      REJECTED: '#EF5350',
      IN_PROGRESS: '#29B6F6',
      PROCESSED: '#AB47BC',
      BLOCKED: '#BDBDBD'
    };

    const color = colorMap[status] || '#90A4AE';

    return L.divIcon({
      className: '',
      html: `
      <div style="
        width: 24px;
        height: 24px;
        background-color: ${color};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        margin-top: -12px;
        margin-left: -12px;
        box-shadow: 0 0 3px rgba(0,0,0,0.5);
      ">
      </div>
    `,
      iconSize: [50, 30],
      iconAnchor: [12, 24]
    });
  }

  getRegions() {
    this.regionsService.getRegions().subscribe(
      (data) => {
        this.regions = data;

      },
      error => {
        console.log(error)
      }
    )
  }

  getProvinces() {
    this.provincesService.getProvinces().subscribe(
      (data) => {
        this.provinces = data;

      },
      error => {
        console.log(error)
      }
    )
  }

  getTypes() {
    this.typeService.getTypes().subscribe(
      (data) => {
        this.types = data;
      },
      error => {
        console.log(error)
      }
    )
  }

  getSectors() {
    this.sectorService.getSectors().subscribe(
      (data) => {
        this.sectors = data;
      },
      error => {
        console.log(error)
      }
    )
  }



}
