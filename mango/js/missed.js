var xhrReload;
var wsPort = 9091;
(function($) {
    "use strict";
    function processTick() {
        var timeDiff = 0;
        var tm=parseInt((new Date().getTime() - timeDiff)/1000);
        $('#lstCalls.today [data-time]').each(function() {
            var period=tm - $(this).attr('data-time');
            var minutes=parseInt(period/60);
            var text;
            if (minutes===0) {
                text='< 1 мин.';
            } else {
                var hours=parseInt(minutes/60);
                minutes-=hours*60;
                if (hours===0) {
                    hours='00';
                } else {
                    if (hours < 10) {hours = '0' + hours;}
                }
                if (minutes<10) {minutes='0'+minutes;}
                text=hours + ':' + minutes;
            }
            if ($(this).text()!==text) {
                $(this).text(text);
            }
        });
    }

    function recalcNumbers() {
        $('#lstCalls.today tr:not(.caption)').each(function(index) {
            $(this).find('td.number').text(index+1);
        });
    }

    /*function runReloadList() {
        if (ifRefreshing) {
            if (!ifRefreshAgain) {ifRefreshAgain=true;}
        } else {
            ifRefreshing = true;
            reloadList();
        }
    }*/

    function reloadList() {
        var wrapper=$('#lstCalls_wrapper');
        var activeTr=wrapper.find('tr:not(.caption).active');
        var activeId='';
        if (activeTr.length) {
            activeId=activeTr.attr('data-idA');
        }
        var date={
            start:wrapper.attr('data-date-start'),
            end:wrapper.attr('data-date-end')
        };
        if (xhrReload) {
            xhrReload.abort();
        }
    }

    $(function() {
        processTick();
        setInterval(processTick,2000);
        setInterval(reloadList, 5000);

        $('body').on('click','#lstCalls tr:not(.caption)',function() {
            if ($(this).hasClass('active')) {
                $(this).removeClass('active');
            } else {
                $(this).addClass('active')
                    .siblings('.active').removeClass('active');
            }
        })

        $('body').on('mousedown','#lstCalls tr:not(.caption) td.phone,#lstCalls tr:not(.caption) td.in_phone',function(e) {
            e.stopPropagation();
        });

        $('body').on('click','#lstCalls .actions .btn-remove',function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (!confirm('Удалить данные об этом звонке?')) {return;}
            var tr=$(this).closest('tr');
            $.post('actions.php',{
                action:'missed_remove',
                id:tr.attr('data-idA')
            })
            tr.remove();
            recalcNumbers();
        })

        $('body').on('click','#lstCalls .actions .btn-ignore',function(e) {
            e.preventDefault();
            e.stopPropagation();
            var tr=$(this).closest('tr');
            var phone=tr.find('td.phone').text();
            if (!confirm('Добавить номер ' + phone + ' в игнорируемые?')) {return;}
            $.post('actions.php',{
                action:'missed_ignore_from',
                phone:phone
            },function() {
                reloadList();
            })
            recalcNumbers();
        })

        $('body').on('mousedown','.clickable',function(e) {
            e.preventDefault();
        })

        reloadList();

        $('#btn-reload').click(function() {
            reloadList();
        })

        $('body').click(function() {
            $('.popup.active').removeClass('active');
        })

        $('.popup .window').click(function(e) {
            e.stopPropagation();
        })

        $('.popup .btn-cancel').click(function() {
            $(this).closest('.popup').removeClass('active');
            var input=$('#popup-settings [name="missed_ignore_to_text"]');
            if(input.attr('data-initial')) {
                input.val(input.attr('data-initial').replace(/,/g, '\n'));
            }
        })
        $('body').on('click','a[data-modal]',function(e) {
            e.preventDefault();
            e.stopPropagation();
            $('#popup-'+$(this).attr('data-modal')).addClass('active');
        })
        $('h1 input').daterangepicker({
            'initialText':'',
            'applyButtonText':'Выбрать',
            'clearButtonText':'',
            'cancelButtonText':'Отменить',
            'dateFormat':'d M yy',
            'presetRanges':[],
        });

        $('h1 .date').click(function(e) {
            $(this).parent().find('button').click();
        })
            .mousedown(function(e) {
                e.preventDefault();
            })

        $('h1 input').change(function() {
            console.log($(this).val());
            var date=JSON.parse($(this).val());
            console.log(date)
            let time={}
             time.start = moment(date.start).unix();
            time.end = moment(date.start).add(1,'days').unix();
            document.getElementById('data-day').innerText=moment(date.start).format('DD-MM-YYYY');
            let msg={};
            msg.type='getCall';
            msg.body=time;
            sendWs(JSON.stringify(msg));
        })

        $('.table-auto-fields').on('input','input:text',function() {
            var table=$(this).closest('.table-auto-fields');
            var inputs=table.find('.line:last input:text');
            var isFilled=false;
            inputs.each(function() {
                if ($(this).val()!='') {isFilled=true;}
            });
            if (isFilled) {
                table.find('.line:first').clone().find('input').val('').end().appendTo(table);
            }
        });
    })
})(jQuery)


$(document).ready(function(){
    var html = [
        '<br>',
        '<br>',
        '<br>',
        '<table>',
        '<th><a href="#" onclick="showTable(0)">Пропущенные звонки</a></th>',
        '<th><a href="#" onclick="showTable(1)">Все звонки</a></th>',
        '<table id="lstmissCalls" class="">',
        '<thead>',
        '<tr class="caption">',
        '<th>№</th>',
        '<th>Номер клиента</th>',
        '<th>Входящий номер</th>',
        '<th>Время звонка</th>',
        '<th>Прошо времени</th>',
        '<th>Описание</th>',
        '<th class="debug-comments">Статус</th>',
        '<th class="actions"></th>',
        '</tr>',
        '</thead>',
        '<tbody>',
        '</tbody>',
        '</table>',
        '<table id="lstCalls" class="" style="display: none">',
        '<thead>',
        '<tr class="caption">',
        '<th>№</th>',
        '<th>Номер клиента</th>',
        '<th>Входящий номер</th>',
        '<th>Время звонка</th>',
        '<th>Прошо времени</th>',
        '<th>Описание</th>',
        '<th class="debug-comments">Статус</th>',
        '<th class="actions"></th>',
        '</tr>',
        '</thead>',
        '<tbody>',
        '</tbody>',
        '</table>'
    ];

    $("body").append(html.join(''));
})
var socket = new WebSocket("ws://82.202.210.44:"+wsPort);
socket.onopen = function() {
    console.log("Соединение установлено.");
    let msg={};
    msg.type='getDesc'
    socket.send(JSON.stringify(msg));
    today=new Date;
    today.setHours(0, 0, 0, 0);
    let time={}
document.getElementById('data-day').innerText=moment(today).format('DD-MM-YYYY');
    time.start = moment(today).unix();
    time.end = moment(today).add(1,'days').unix();
    let msg2={};
    msg2.type='getCall';
    msg2.body=time;
    sendWs(JSON.stringify(msg2));
};

socket.onclose = function(event) {
    if (event.wasClean) {
        console.log('Соединение закрыто чисто');
    } else {
        console.log('Обрыв соединения'); // например, "убит" процесс сервера
    }
    console.log('Код: ' + event.code + ' причина: ' + event.reason);
};

socket.onmessage = function(event) {
    message = JSON.parse(event.data)
    if (message.type == 'sendCall') {
        console.log("Получены данные " + event.data);
        $('#lstmissCalls tbody').empty();
        $('#lstCalls tbody').empty();

        miss = message.miss;
        all = message.all;

        number = 1;
        miss.forEach(function (item) {

            if (item.type == 1) {
                status="";
                if(item.ask){
                    if(item.ask==1){
                        status=" (перезвонили)"
                    }
                }
                $('#lstmissCalls tbody').append(' <tr data-to-number="78123132423" data-ida="1981366" class="clickable">\n' +
                    '        <td class="number">' + number + '</td>\n' +
                    '        <td class="phone">' + item.tell + '</td>\n' +
                    '        <td class="in_phone">-</td>\n' +
                    '        <td>' + moment.unix(item.time).format("kk:mm") + '</td>\n' +
                    '        <td data-time="1541749095">-</td>\n' +
                    '        <td>' + item.desc + '</td>\n' +
                    '        <td class="debug-comments">Пропущенный '+status+'</td>\n' +
                    '    </tr>');
            }

            else if (item.type == 2) {
                status="";
                if(item.ask){
                    if(item.ask==1){
                        status=" (перезвонил)"
                    }
                }
                $('#lstmissCalls tbody').append(' <tr data-to-number="78123132423" data-ida="1981366" class="clickable">\n' +
                    '        <td class="number">' + number + '</td>\n' +
                    '        <td class="phone">-</td>\n' +
                    '        <td class="in_phone">' + item.tell + '</td>\n' +
                    '        <td>' + moment.unix(item.time).format("kk:mm") + '</td>\n' +
                    '        <td data-time="1541749095">-</td>\n' +
                    '        <td>' + item.desc + '</td>\n' +
                    '        <td class="debug-comments">Игнорируемый исходящий вызов '+status+'</td>\n' +
                    '    </tr>');
            }
            number++;
        })

        number=1;
        all.forEach(function (item) {

            if (item.type == 1) {
                status="";
                if(item.ask){
                    if(item.ask==1){
                        status=" (перезвонили)"
                    }
                }
                $('#lstCalls tbody').append(' <tr data-to-number="78123132423" data-ida="1981366" class="clickable">\n' +
                    '        <td class="number">' + number + '</td>\n' +
                    '        <td class="phone">' + item.tell + '</td>\n' +
                    '        <td class="in_phone">-</td>\n' +
                    '        <td>' + moment.unix(item.time).format("kk:mm") + '</td>\n' +
                    '        <td data-time="1541749095">-</td>\n' +
                    '        <td>' + item.desc + '</td>\n' +
                    '        <td class="debug-comments">Входящий</td>\n' +
                    '    </tr>');
            }

            else if (item.type == 2) {
                status="";
                if(item.ask){
                    if(item.ask==1){
                        status=" (перезвонил)"
                    }
                }
                $('#lstCalls tbody').append(' <tr data-to-number="78123132423" data-ida="1981366" class="clickable">\n' +
                    '        <td class="number">' + number + '</td>\n' +
                    '        <td class="phone">-</td>\n' +
                    '        <td class="in_phone">' + item.tell + '</td>\n' +
                    '        <td>' + moment.unix(item.time).format("kk:mm") + '</td>\n' +
                    '        <td data-time="1541749095">-</td>\n' +
                    '        <td>' + item.desc + '</td>\n' +
                    '        <td class="debug-comments">Исходящий</td>\n' +
                    '    </tr>');
            }
            number++;
        })
    }
    else if(message.type == 'sendDesc'){
        arr = message.body;
        arr.forEach(function (item) {
            html = '<div class="line">\n' +
                '<input name="in_phone[number][]" placeholder="Введите номер" type="text" value="'+item.tell+'"/>' +
                '<input name="in_phone[description][]" placeholder="Введите описание" type="text" value="'+item.desc+'"/>\n' +
                '</div>'
            console.log("Получены данные " + event.data);
            $('#descList').append(html);
        })
    }
    ;
}
socket.onerror = function(error) {
    console.log("Ошибка " + error.message);
};
 function saveDesc() {
     body=[];
     var elem = $("#descList div");
     elem.map(function (item) {
         if(elem[item].childNodes[1].value && elem[item].childNodes[2].value){
             body.push({"tell":elem[item].childNodes[1].value, "desc": elem[item].childNodes[2].value})
         }
     })
     msg={"type":"createDesc", "body":body}
     sendWs(JSON.stringify(msg));
     $('#popup-settings').removeClass('active');
 }
function sendWs(msg) {
    socket.send(msg);

}

function showTable(type) {
     if(type==0){
      $('#lstmissCalls').show()
         $('#lstCalls').hide()
         $('#titleSpan').html('Пропущенные звонки')

     }
    else if(type==1){
         $('#lstmissCalls').hide()
         $('#lstCalls').show()
         $('#titleSpan').html('Принятые звонки')

     }
}