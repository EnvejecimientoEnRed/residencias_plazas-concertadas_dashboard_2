import { getIframeParams } from './helpers/height';
import { setChartCanvas, setChartCanvasImage } from './helpers/canvas-image';
import { setRRSSLinks } from './helpers/rrss';
import { getInTooltip, getOutTooltip, positionTooltip } from './helpers/tooltip';
import { numberWithCommas, numberWithCommas2 } from './helpers/helpers';
import './helpers/tabs';
import 'url-search-params-polyfill';

//Desarrollo de la visualización
import * as d3 from 'd3';
import * as topojson from "topojson-client";
let d3_composite = require("d3-composite-projections");

//Necesario para importar los estilos de forma automática en la etiqueta 'style' del html final
import '../css/main.scss';

/////
///// VISUALIZACIÓN DEL GRÁFICO /////
/////
let mapBlock = d3.select('#mapa'), vizBlock = d3.select('#viz');
let mapWidth = parseInt(mapBlock.style('width')), mapHeight = window.innerWidth < 640 ? mapWidth * 0.62 > 340 ? 340 : mapWidth * 0.62 : parseInt(mapBlock.style('height')),
    vizWidth = window.innerWidth >= 640 ? parseInt(vizBlock.style('width')) : parseInt(vizBlock.style('width')) - 40, vizHeight = parseInt(vizBlock.style('height'));

if(window.innerWidth < 640) {
    document.getElementsByClassName('chart__dashboard')[0].style.height = mapHeight + vizHeight + 8 + 9 + 'px';
}

let mapLayer, vizLayer;
let projection, path, colors;
let ccaaData = [], provData = [], ccaaMap, provMap;
let tooltip = d3.select('#tooltip');

/////EJECUCIÓN INICIAL DEL DASHBOARD
const csv = d3.dsvFormat(",");

d3.queue()
    .defer(d3.text, 'https://raw.githubusercontent.com/CarlosMunozDiazCSIC/plazas_concertadas_residencias/main/data/ccaa_plazas_priv_conc.csv')
    .defer(d3.text, 'https://raw.githubusercontent.com/CarlosMunozDiazCSIC/plazas_concertadas_residencias/main/data/prov_plazas_priv_conc.csv')
    .defer(d3.json, 'https://raw.githubusercontent.com/CarlosMunozDiazCSIC/plazas_concertadas_residencias/main/data/ccaa.json')
    .defer(d3.json, 'https://raw.githubusercontent.com/CarlosMunozDiazCSIC/plazas_concertadas_residencias/main/data/provincias.json')
    .await(function(error, ccaa, prov, ccaaPol, provPol) {
        if (error) throw error;

        ccaaData = csv.parse(ccaa);
        provData = csv.parse(prov);

        ccaaData = ccaaData.reverse();
        provData = provData.reverse();

        ccaaMap = topojson.feature(ccaaPol, ccaaPol.objects['ccaa']);
        provMap = topojson.feature(provPol, provPol.objects['provincias']);

        //Dejamos los datos incluidos en los polígonos de los mapas
        ccaaMap.features.forEach(function(item) {
            let dato = ccaaData.filter(function(subItem) {
                if(parseInt(subItem.id) == parseInt(item.id)) {
                    return subItem;
                };
            });
            item.data = dato[0];
        });

        provMap.features.forEach(function(item) {
            let dato = provData.filter(function(subItem) {
                if(parseInt(subItem.id) == parseInt(item.properties.cod_prov)) {
                    return subItem;
                };
            });
            item.data = dato[0];
        });

        //Uso de colores
        colors = d3.scaleLinear()
            .domain([25,50,75,100])
            .range(['#a7e7e7', '#68a7a7', '#2b6b6c', '#003334']);

        initDashboard();

    });

function initDashboard() {
    initMap();
    window.innerWidth >= 640 ? initViz() : initMobileViz();

    setTimeout(() => {
        setChartCanvas();
    }, 5000);
}

//MAPA
function initMap() {
    mapLayer = mapBlock.append('svg').attr('id', 'map').attr('width', mapWidth).attr('height', mapHeight);
    projection = d3_composite.geoConicConformalSpain().scale(1800).fitSize([mapWidth,mapHeight], ccaaMap);
    path = d3.geoPath(projection);

    mapLayer.selectAll("poligonos")
        .data(ccaaMap.features)
        .enter()
        .append("path")
        .attr("class", "poligonos")
        .attr('data-abrev', function(d) { return `poligono-${d.data.abrev}`; })
        .style('fill', function(d) {
            return colors(+d.data.porc_concertadas);
        })
        .style('stroke', '#282828')
        .style('stroke-width', '0.25px')
        .attr("d", path)
        .on('mousemove mouseover', function(d,i,e){
            //Línea diferencial y cambio del polígonos
            let current = this;
            
            document.getElementsByTagName('svg')[0].removeChild(this);
            document.getElementsByTagName('svg')[0].appendChild(current);

            current.style.stroke = '#000';
            current.style.strokeWidth = '1px';

            //Elemento HTML > Tooltip
            let html = '<p class="chart__tooltip--title">' + d.data.lugar + 
            '<p class="chart__tooltip--text">Plazas totales:' + numberWithCommas2(d.data.plazas_total) + '</p>' +
            '<p class="chart__tooltip--text">Plazas concertadas: ' + numberWithCommas2(d.data.plazas_concertadas) + '</p>' +
            '<p class="chart__tooltip--text">Porc. de concertadas: ' + numberWithCommas(d.data.porc_concertadas) + '%</p>';

            tooltip.html(html);

            //Tooltip
            getInTooltip(tooltip);                
            positionTooltip(window.event, tooltip);

            //Jugar con las líneas y las abreviaturas
            let currentLinear = d.data.abrev;
            
            d3.selectAll('.linea,.nacional,.texto')
                .style('opacity', 0.125);

            d3.select(`[data-abrev="linea-${currentLinear}"]`)
                .style('opacity', 1);

            d3.select(`[data-abrev="texto-${currentLinear}"]`)
                .style('opacity', 1);
        })
        .on('mouseout', function(d,i,e) {
            //Línea diferencial
            this.style.stroke = '#282828';
            this.style.strokeWidth = '0.25px';

            //Desaparición del tooltip
            getOutTooltip(tooltip);

            //Jugar con las líneas
            d3.selectAll('.linea,.nacional')
                .style('opacity', 1);

            d3.selectAll('.texto')
                .style('opacity', 0.25);
        });

    mapLayer.append('path')
        .style('fill', 'none')
        .style('stroke', '#000')
        .attr('d', projection.getCompositionBorders());
}

function setMap(type) {
    let auxData = [];

    if (type == 'ccaa') {
        auxData = ccaaMap;
    } else {
        auxData = provMap;
    }

    mapLayer.selectAll(".poligonos")
        .remove();

    mapLayer.selectAll("poligonos")
        .data(auxData.features)
        .enter()
        .append("path")
        .attr("class", "poligonos")
        .attr('data-abrev', function(d) { return `poligono-${d.data.abrev}`; })
        .style('fill', function(d) {
            return colors(+d.data.porc_concertadas);
        })
        .style('stroke', '#282828')
        .style('stroke-width', '0.25px')
        .attr("d", path)
        .on('mousemove mouseover', function(d,i,e){
            //Línea diferencial y cambio del polígonos
            let current = this;
            
            document.getElementsByTagName('svg')[0].removeChild(this);
            document.getElementsByTagName('svg')[0].appendChild(current);

            current.style.stroke = '#000';
            current.style.strokeWidth = '1px';

            //Elemento HTML > Tooltip
            let html = '<p class="chart__tooltip--title">' + d.data.lugar + 
            '<p class="chart__tooltip--text">Plazas totales:' + numberWithCommas2(d.data.plazas_total) + '</p>' +
            '<p class="chart__tooltip--text">Plazas concertadas: ' + numberWithCommas2(d.data.plazas_concertadas) + '</p>' +
            '<p class="chart__tooltip--text">Porc. de concertadas: ' + numberWithCommas(d.data.porc_concertadas) + '%</p>';

            tooltip.html(html);

            //Tooltip
            getInTooltip(tooltip);                
            positionTooltip(window.event, tooltip);

            //Jugar con las líneas y las abreviaturas
            let currentLinear = d.data.abrev;
            
            d3.selectAll('.linea,.nacional,.texto')
                .style('opacity', 0.125);

            d3.select(`[data-abrev="linea-${currentLinear}"]`)
                .style('opacity', 1);

            d3.select(`[data-abrev="texto-${currentLinear}"]`)
                .style('opacity', 1);
        })
        .on('mouseout', function(d,i,e) {
            //Línea diferencial
            this.style.stroke = '#282828';
            this.style.strokeWidth = '0.25px';

            //Desaparición del tooltip
            getOutTooltip(tooltip);

            //Jugar con las líneas
            d3.selectAll('.linea,.nacional')
                .style('opacity', 1);

            d3.selectAll('.texto')
                .style('opacity', 0.25);
        });
}

//LÍNEA
function initViz() {
    vizLayer = vizBlock
        .append('svg')
        .attr('width', vizWidth)
        .attr('height', vizHeight);

    //Creación de la línea vertical
    vizLayer.selectAll('linea-vertical')
        .data([0])
        .enter()
        .append('rect')
        .attr('class', 'linea-vertical')
        .attr('width', 2)
        .attr('height', vizHeight + 5)
        .style('fill', '#cdcdcd')
        .attr('x', (vizWidth / 2));

    //Generación de los dígitos para eje Y
    vizLayer.selectAll('texto')
        .data([0,50,100])
        .enter()
        .append('text')
        .style('cursor','default')
        .style('font-size', '12px')
        .style('fill', '#262626')
        .style('text-anchor', 'start')
        .text(function(d) { return d + "%  "; })
        .attr('x', 0)
        .attr('y', function(d) { 
            if(d == 100) {
                return 8.5;
            } else {
                return vizHeight - (d * vizHeight / 100);
            }  
        });

    //Generación de datos en el grupo
    vizLayer.selectAll('lineas')
        .data(ccaaData)
        .enter()
        .append('rect')
        .attr('class', function(d) {
            if (d.abrev == 'NAC') {
                return 'linea-nacional';
            } else {
                return 'linea';
            }
        })
        .attr('data-abrev', function(d) { return `linea-${d.abrev}`})
        .attr('width', 50)
        .attr('height', 1.5)
        .style('fill', function(d) {
            if (d.abrev == 'NAC') {
                return 'red';
            } else {
                return colors(+d.porc_concertadas);
            }  
        })
        .attr('x', (vizWidth / 2) - 25)
        .attr('y', function(d) { return vizHeight - (+d.porc_concertadas * vizHeight / 100); })
        .on('mousemove mouseover', function(d,i,e){
            //Jugar con las líneas y las abreviaturas
            let currentLinear = d.abrev;
            
            d3.selectAll('.linea,.nacional,.texto')
                .style('opacity', 0.125);

            d3.select(`[data-abrev="linea-${currentLinear}"]`)
                .style('opacity', 1);

            d3.select(`[data-abrev="texto-${currentLinear}"]`)
                .style('opacity', 1);

            //Jugar con los polígonos
            let current = document.querySelector(`[data-abrev="poligono-${currentLinear}"]`);
            let copy = current;
            let copy2 = d3.select(`[data-abrev="poligono-${currentLinear}"]`);

            document.getElementsByTagName('svg')[0].removeChild(current);
            document.getElementsByTagName('svg')[0].appendChild(copy);

            copy.style.stroke = '#000';
            copy.style.strokeWidth = '1px';

            //Tooltip
            setCentroidTooltip(currentLinear, 'ccaa', copy2);            
        })
        .on('mouseout', function(d,i,e) {
            let currentLinear = d.abrev;

            //Jugar con las líneas
            d3.selectAll('.linea,.nacional')
                .style('opacity', 1);

            d3.selectAll('.texto')
                .style('opacity', 0.25);

            //Jugar con los polígonos
            let current = document.querySelector(`[data-abrev="poligono-${currentLinear}"]`);
            
            current.style.stroke = '#282828';
            current.style.strokeWidth = '0.25px';

            //Desaparición del tooltip
            getOutTooltip(tooltip);            
        });

    //Generación de letras
    vizLayer.selectAll('texto')
        .data(ccaaData)
        .enter()
        .append('text')
        .style('cursor','default')
        .style('font-size', 12)
        .style('opacity', function(d) {
            if(d.abrev == 'NAC') {
                return 1;
            } else {
                return 0.25;
            }
        })
        .style('text-anchor', 'end')
        .text(function(d) { return d.abrev; })
        .attr('class', function(d) {
            if(d.abrev == 'NAC') {
                return 'nacional';
            } else {
                return 'texto';
            }
        })
        .attr('data-abrev', function(d) { return `texto-${d.abrev}`})
        .attr('x', 128.5)
        .attr('y', function(d) {
            if (d.abrev == 'CE') {
                return 8.5;
            } else {
                return vizHeight - (+d.porc_concertadas * vizHeight / 100) + 5;
            }
        })
        .on('mousemove mouseover', function(d,i,e){
            //Jugar con las líneas y las abreviaturas
            let currentLinear = d.abrev;
            
            d3.selectAll('.nacional,.linea,.texto')
                .style('opacity', 0.125);

            d3.select(`[data-abrev="linea-${currentLinear}"]`)
                .style('opacity', 1);

            d3.select(`[data-abrev="texto-${currentLinear}"]`)
                .style('opacity', 1);

            //Jugar con los polígonos
            let current = document.querySelector(`[data-abrev="poligono-${currentLinear}"]`);
            let copy = current;
            let copy2 = d3.select(`[data-abrev="poligono-${currentLinear}"]`);

            document.getElementsByTagName('svg')[0].removeChild(current);
            document.getElementsByTagName('svg')[0].appendChild(copy);

            copy.style.stroke = '#000';
            copy.style.strokeWidth = '1px';

            //Tooltip
            setCentroidTooltip(currentLinear, 'ccaa', copy2);            
        })
        .on('mouseout', function(d,i,e) {
            let currentLinear = d.abrev;

            //Jugar con las líneas
            d3.selectAll('.linea,.nacional')
                .style('opacity', 1);

            d3.selectAll('.texto')
                .style('opacity', 0.25);

            //Jugar con los polígonos
            let current = document.querySelector(`[data-abrev="poligono-${currentLinear}"]`);
            
            current.style.stroke = '#282828';
            current.style.strokeWidth = '0.25px';

            //Desaparición del tooltip
            getOutTooltip(tooltip);            
        });
}

function initMobileViz() {
    vizLayer = vizBlock
        .append('svg')
        .attr('width', vizWidth)
        .attr('height', vizHeight)
        .style('transform', 'translateX(20px)');

    //Creación de la línea horizontal
    vizLayer.selectAll('linea-horizontal')
        .data([0])
        .enter()
        .append('rect')
        .attr('class', 'linea-horizontal')
        .attr('width', '100%')
        .attr('height', '2px')
        .style('fill', '#cdcdcd')
        .attr('y', (vizHeight / 2));

    //Generación de los dígitos para eje Y
    vizLayer.selectAll('texto')
        .data([0,50,100])
        .enter()
        .append('text')
        .style('cursor','default')
        .style('font-size', '12px')
        .style('fill', '#262626')
        .style('text-anchor', 'start')
        .text(function(d) { return d + "%  "; })
        .attr('x', function(d) {
            if(d == 100) {
                return vizWidth - 30;
            } else {
                return d * vizWidth / 100;
            }  
        })
        .attr('y', 10);

    //Generación de datos en el grupo
    vizLayer.selectAll('lineas')
        .data(ccaaData)
        .enter()
        .append('rect')
        .attr('class', function(d) {
            if (d.abrev == 'NAC') {
                return 'linea-nacional';
            } else {
                return 'linea';
            }
        })
        .attr('data-abrev', function(d) { return `linea-${d.abrev}`})
        .attr('width', 1.5)
        .attr('height', 30)
        .style('fill', function(d) {
            if (d.abrev == 'NAC') {
                return 'red';
            } else {
                return colors(+d.porc_concertadas);
            }  
        })
        .attr('y', (vizHeight / 2) - 15)
        .attr('x', function(d) {
            if (d.abrev == 'CE'){
                return vizWidth - 2;
            } else {
                return +d.porc_concertadas * vizWidth / 100;
            }  
        })
        .on('mousemove mouseover', function(d,i,e){
            //Jugar con las líneas y las abreviaturas
            let currentLinear = d.abrev;
            
            d3.selectAll('.linea')
                .style('opacity', 0.125);

            d3.selectAll('.texto')
                .style('opacity', 0.125);

            d3.select(`[data-abrev="linea-${currentLinear}"]`)
                .style('opacity', 1);

            d3.select(`[data-abrev="texto-${currentLinear}"]`)
                .style('opacity', 1);

            //Jugar con los polígonos
            let current = document.querySelector(`[data-abrev="poligono-${currentLinear}"]`);
            let copy = current;
            let copy2 = d3.select(`[data-abrev="poligono-${currentLinear}"]`);

            document.getElementsByTagName('svg')[0].removeChild(current);
            document.getElementsByTagName('svg')[0].appendChild(copy);

            copy.style.stroke = '#000';
            copy.style.strokeWidth = '1px';

            //Tooltip
            setCentroidTooltip(currentLinear, 'ccaa', copy2);            
        })
        .on('mouseout', function(d,i,e) {
            let currentLinear = d.abrev;

            //Jugar con las líneas
            d3.selectAll('.linea')
                .style('opacity', 1);

            d3.selectAll('.texto')
                .style('opacity', 0.25);

            //Jugar con los polígonos
            let current = document.querySelector(`[data-abrev="poligono-${currentLinear}"]`);
            
            current.style.stroke = '#282828';
            current.style.strokeWidth = '0.25px';

            //Desaparición del tooltip
            getOutTooltip(tooltip);            
        });

    //Generación de letras
    vizLayer.selectAll('texto')
        .data(ccaaData)
        .enter()
        .append('text')
        .style('cursor','default')
        .style('font-size', 12)
        .style('opacity', function(d) {
            if(d.abrev == 'NAC') {
                return 1;
            } else {
                return 0.125;
            }
        })
        .style('text-anchor', 'end')
        .text(function(d) { return d.abrev; })
        .attr('class', function(d) {
            if(d.abrev == 'NAC') {
                return 'nacional';
            } else {
                return 'texto';
            }
        })
        .attr('data-abrev', function(d) { return `texto-${d.abrev}`})
        .attr('y', 60)
        .attr('x', function(d) {
            if (d.abrev == 'CE') {
                return vizWidth;
            } else {
                return +d.porc_concertadas * vizWidth / 100 + 10;
            }
        })
        .on('mousemove mouseover', function(d,i,e){
            //Jugar con las líneas y las abreviaturas
            let currentLinear = d.abrev;
            
            d3.selectAll('.linea,.nacional,.texto')
                .style('opacity', 0.125);

            d3.select(`[data-abrev="linea-${currentLinear}"]`)
                .style('opacity', 1);

            d3.select(`[data-abrev="texto-${currentLinear}"]`)
                .style('opacity', 1);

            //Jugar con los polígonos
            let current = document.querySelector(`[data-abrev="poligono-${currentLinear}"]`);
            let copy = current;
            let copy2 = d3.select(`[data-abrev="poligono-${currentLinear}"]`);

            document.getElementsByTagName('svg')[0].removeChild(current);
            document.getElementsByTagName('svg')[0].appendChild(copy);

            copy.style.stroke = '#000';
            copy.style.strokeWidth = '1px';

            //Tooltip
            setCentroidTooltip(currentLinear, 'ccaa', copy2);            
        })
        .on('mouseout', function(d,i,e) {
            let currentLinear = d.abrev;

            //Jugar con las líneas
            d3.selectAll('.linea,.nacional')
                .style('opacity', 1);

            d3.selectAll('.texto')
                .style('opacity', 0.125);

            //Jugar con los polígonos
            let current = document.querySelector(`[data-abrev="poligono-${currentLinear}"]`);
            
            current.style.stroke = '#282828';
            current.style.strokeWidth = '0.25px';

            //Desaparición del tooltip
            getOutTooltip(tooltip);            
        });
}

function setViz(type) {
    let auxData = [];

    if(type == 'ccaa') {
        auxData = ccaaData;
    } else {
        auxData = provData;
    }

    vizLayer.select('.nacional')
        .remove();

    vizLayer.selectAll('.linea')
        .remove();

    vizLayer.selectAll('.texto')
        .remove();

    //Generación de datos en el grupo
    vizLayer.selectAll('lineas')
        .data(auxData)
        .enter()
        .append('rect')
        .attr('class', function(d) {
            if (d.abrev == 'NAC') {
                return 'linea-nacional';
            } else {
                return 'linea';
            }
        })
        .attr('data-abrev', function(d) { return `linea-${d.abrev}`})
        .attr('width', 60)
        .attr('height', 1.5)
        .style('fill', function(d) {
            if (d.abrev == 'NAC') {
                return 'red';
            } else {
                return colors(+d.porc_concertadas);
            }  
        })
        .attr('x', (vizWidth / 2) - 30)
        .attr('y', function(d) { return vizHeight - (+d.porc_concertadas * vizHeight / 100); })
        .on('mousemove mouseover', function(d,i,e){
            //Jugar con las líneas y las abreviaturas
            let currentLinear = d.abrev;
            
            d3.selectAll('.linea,.nacional,.texto')
                .style('opacity', 0.125);

            d3.select(`[data-abrev="linea-${currentLinear}"]`)
                .style('opacity', 1);

            d3.select(`[data-abrev="texto-${currentLinear}"]`)
                .style('opacity', 1);

            //Jugar con los polígonos
            let current = document.querySelector(`[data-abrev="poligono-${currentLinear}"]`);
            let copy = current;
            let copy2 = d3.select(`[data-abrev="poligono-${currentLinear}"]`);

            document.getElementsByTagName('svg')[0].removeChild(current);
            document.getElementsByTagName('svg')[0].appendChild(copy);

            copy.style.stroke = '#000';
            copy.style.strokeWidth = '1px';

            //Tooltip
            setCentroidTooltip(currentLinear, type, copy2);            
        })
        .on('mouseout', function(d,i,e) {
            let currentLinear = d.abrev;

            //Jugar con las líneas
            d3.selectAll('.linea,.nacional')
                .style('opacity', 1);

            d3.selectAll('.texto')
                .style('opacity', 0.25);

            //Jugar con los polígonos
            let current = document.querySelector(`[data-abrev="poligono-${currentLinear}"]`);
            
            current.style.stroke = '#282828';
            current.style.strokeWidth = '0.25px';

            //Desaparición del tooltip
            getOutTooltip(tooltip);            
        });

    //Generación de letras
    vizLayer.selectAll('texto')
        .data(auxData)
        .enter()
        .append('text')
        .style('cursor','default')
        .style('font-size', 12)
        .style('opacity', function(d) {
            if(d.abrev == 'NAC') {
                return 1;
            } else {
                return 0.25;
            }
        })
        .style('text-anchor', 'end')
        .text(function(d) { return d.abrev; })
        .attr('class', function(d) {
            if(d.abrev == 'NAC') {
                return 'nacional';
            } else {
                return 'texto';
            }
        })
        .attr('data-abrev', function(d) { return `texto-${d.abrev}`})
        .attr('x', 128.5)
        .attr('y', function(d) {
            if (d.abrev == 'CE') {
                return 8.5;
            } else {
                return vizHeight - (+d.porc_concertadas * vizHeight / 100) + 5;
            }
        })
        .on('mousemove mouseover', function(d,i,e){
            //Jugar con las líneas y las abreviaturas
            let currentLinear = d.abrev;
            
            d3.selectAll('.linea,.nacional,.texto')
                .style('opacity', 0.125);

            d3.select(`[data-abrev="linea-${currentLinear}"]`)
                .style('opacity', 1);

            d3.select(`[data-abrev="texto-${currentLinear}"]`)
                .style('opacity', 1);

            //Jugar con los polígonos
            let current = document.querySelector(`[data-abrev="poligono-${currentLinear}"]`);
            let copy = current;
            let copy2 = d3.select(`[data-abrev="poligono-${currentLinear}"]`);

            document.getElementsByTagName('svg')[0].removeChild(current);
            document.getElementsByTagName('svg')[0].appendChild(copy);

            copy.style.stroke = '#000';
            copy.style.strokeWidth = '1px';

            //Tooltip
            setCentroidTooltip(currentLinear, type, copy2);           
        })
        .on('mouseout', function(d,i,e) {
            let currentLinear = d.abrev;

            //Jugar con las líneas
            d3.selectAll('.linea,.nacional')
                .style('opacity', 1);

            d3.selectAll('.texto')
                .style('opacity', 0.25);

            //Jugar con los polígonos
            let current = document.querySelector(`[data-abrev="poligono-${currentLinear}"]`);
            
            current.style.stroke = '#282828';
            current.style.strokeWidth = '0.25px';

            //Desaparición del tooltip
            getOutTooltip(tooltip);            
        });
}

function setMobileViz(type) {
    let auxData = [];

    if(type == 'ccaa') {
        auxData = ccaaData;
    } else {
        auxData = provData;
    }

    vizLayer.select('.nacional')
        .remove();

    vizLayer.selectAll('.linea')
        .remove();

    vizLayer.selectAll('.texto')
        .remove();

    //Generación de datos en el grupo
    vizLayer.selectAll('lineas')
        .data(auxData)
        .enter()
        .append('rect')
        .attr('class', function(d) {
            if (d.abrev == 'NAC') {
                return 'linea-nacional';
            } else {
                return 'linea';
            }
        })
        .attr('data-abrev', function(d) { return `linea-${d.abrev}`})
        .attr('width', 1.5)
        .attr('height', 30)
        .style('fill', function(d) {
            if (d.abrev == 'NAC') {
                return 'red';
            } else {
                return colors(+d.porc_concertadas);
            }  
        })
        .attr('y', (vizHeight / 2) - 15)
        .attr('x', function(d) {
            if (d.abrev == 'CE'){
                return vizWidth - 2;
            } else {
                return +d.porc_concertadas * vizWidth / 100;
            }  
        })
        .on('mousemove mouseover', function(d,i,e){
            //Jugar con las líneas y las abreviaturas
            let currentLinear = d.abrev;
            
            d3.selectAll('.linea,.nacional,.texto')
                .style('opacity', 0.125);

            d3.select(`[data-abrev="linea-${currentLinear}"]`)
                .style('opacity', 1);

            d3.select(`[data-abrev="texto-${currentLinear}"]`)
                .style('opacity', 1);

            //Jugar con los polígonos
            let current = document.querySelector(`[data-abrev="poligono-${currentLinear}"]`);
            let copy = current;
            let copy2 = d3.select(`[data-abrev="poligono-${currentLinear}"]`);

            document.getElementsByTagName('svg')[0].removeChild(current);
            document.getElementsByTagName('svg')[0].appendChild(copy);

            copy.style.stroke = '#000';
            copy.style.strokeWidth = '1px';

            //Tooltip
            setCentroidTooltip(currentLinear, type, copy2);            
        })
        .on('mouseout', function(d,i,e) {
            let currentLinear = d.abrev;

            //Jugar con las líneas
            d3.selectAll('.linea,.nacional')
                .style('opacity', 1);

            d3.selectAll('.texto')
                .style('opacity', 0.125);

            //Jugar con los polígonos
            let current = document.querySelector(`[data-abrev="poligono-${currentLinear}"]`);
            
            current.style.stroke = '#282828';
            current.style.strokeWidth = '0.25px';

            //Desaparición del tooltip
            getOutTooltip(tooltip);            
        });

    //Generación de letras
    vizLayer.selectAll('texto')
        .data(auxData)
        .enter()
        .append('text')
        .style('cursor','default')
        .style('font-size', 12)
        .style('opacity', function(d) {
            if(d.abrev == 'NAC') {
                return 1;
            } else {
                return 0.125;
            }
        })
        .style('text-anchor', 'end')
        .text(function(d) { return d.abrev; })
        .attr('class', function(d) {
            if(d.abrev == 'NAC') {
                return 'nacional';
            } else {
                return 'texto';
            }
        })
        .attr('data-abrev', function(d) { return `texto-${d.abrev}`})
        .attr('y', 60)
        .attr('x', function(d) {
            if (d.abrev == 'CE') {
                return vizWidth;
            } else {
                return +d.porc_concertadas * vizWidth / 100 + 10;
            }
        })
        .on('mousemove mouseover', function(d,i,e){
            //Jugar con las líneas y las abreviaturas
            let currentLinear = d.abrev;
            
            d3.selectAll('.linea,.nacional,.texto')
                .style('opacity', 0.125);

            d3.select(`[data-abrev="linea-${currentLinear}"]`)
                .style('opacity', 1);

            d3.select(`[data-abrev="texto-${currentLinear}"]`)
                .style('opacity', 1);

            //Jugar con los polígonos
            let current = document.querySelector(`[data-abrev="poligono-${currentLinear}"]`);
            let copy = current;
            let copy2 = d3.select(`[data-abrev="poligono-${currentLinear}"]`);

            document.getElementsByTagName('svg')[0].removeChild(current);
            document.getElementsByTagName('svg')[0].appendChild(copy);

            copy.style.stroke = '#000';
            copy.style.strokeWidth = '1px';

            //Tooltip
            setCentroidTooltip(currentLinear, type, copy2);            
        })
        .on('mouseout', function(d,i,e) {
            let currentLinear = d.abrev;

            //Jugar con las líneas
            d3.selectAll('.linea,.nacional')
                .style('opacity', 1);

            d3.selectAll('.texto')
                .style('opacity', 0.25);

            //Jugar con los polígonos
            let current = document.querySelector(`[data-abrev="poligono-${currentLinear}"]`);
            
            current.style.stroke = '#282828';
            current.style.strokeWidth = '0.25px';

            //Desaparición del tooltip
            getOutTooltip(tooltip);            
        });
}

//SETEO DEL DASHBOARD
let btnChart = document.getElementsByClassName('btn__chart');

for(let i = 0; i < btnChart.length; i++) {
    btnChart[i].addEventListener('click', function() {
        //Cambiamos estilos del botón
        for(let i = 0; i < btnChart.length; i++) {
            btnChart[i].classList.remove('active');
        }
        this.classList.add('active');
        //Cambiamos el dashboard
        setDashboard(this.getAttribute('data-type'));
    })
}

function setDashboard(type) {
    setMap(type);
    window.innerWidth >= 640 ? setViz(type) : setMobileViz(type);

    setTimeout(() => {
        setChartCanvas();
    }, 5000);
}

//HELPER
function setCentroidTooltip(dataPol, type, poligono) {
    //Conocer qué datos estamos utilizando para luego poder mostrarlo
    let elem = poligono.node();
    let bbox = elem.getBBox();
    
    let centroide = [bbox.x + bbox.width, bbox.y + bbox.height];

    //Tooltip
    let aux = [];
    if(type == 'ccaa') {
        aux = ccaaMap.features.filter(function(item) {
            if (item.data.abrev == dataPol) {
                return item;
            }
        });
        aux = aux[0];
    } else {
        aux = provMap.features.filter(function(item) {
            if (item.data.abrev == dataPol) {
                return item;
            }
        });
        aux = aux[0];
    }
    
    //Elemento HTML > Tooltip
    let html = '<p class="chart__tooltip--title">' + aux.data.lugar + 
    '<p class="chart__tooltip--text">Plazas totales:' + numberWithCommas2(aux.data.plazas_total) + '</p>' +
    '<p class="chart__tooltip--text">Plazas concertadas: ' + numberWithCommas2(aux.data.plazas_concertadas) + '</p>' +
    '<p class="chart__tooltip--text">Porc. de concertadas: ' + numberWithCommas(aux.data.porc_concertadas) + '%</p>';

    tooltip.html(html);
    
    let prueba = mapBlock.node().getBoundingClientRect().top;
    let prueba2 = mapBlock.node().getBoundingClientRect().left;

    //Búsqueda del centroide para ubicar el tooltip
    getInTooltip(tooltip); 
    tooltip.style('top', prueba + centroide[1] + 'px');
    tooltip.style('left', prueba2 + centroide[0] - 60 + 'px');
}

///// REDES SOCIALES /////
setRRSSLinks();

///// ALTURA DEL BLOQUE DEL GRÁFICO //////
getIframeParams();

///// DESCARGA COMO PNG O SVG > DOS PASOS/////
let pngDownload = document.getElementById('pngImage');

pngDownload.addEventListener('click', function(){
    setChartCanvasImage();
});