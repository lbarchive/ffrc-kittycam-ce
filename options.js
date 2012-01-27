function load_options() {
  var kb_options = localStorage['kb-option'] || 'popup';

  $('#kb-' + kb_options).prop('checked', true).button('refresh');
}

function save_options() {
  var kb_options = $('#kb-options input:checked').attr('id').replace('kb-', '');
  localStorage['kb-option'] = kb_options;
  chrome.extension.sendRequest({name: 'update_kb_option'});
  $('#save-message').toggle('blind').delay(5000).toggle('blind');
}

function init_page() {
  for (var i=0; i<5; i++) {
    $('<img/>').attr('src', 'icon16.png').appendTo( 'body > .wrapper > header h2');
    $('<img/>').attr('src', 'icon16.png').prependTo('body > .wrapper > header h2');
  }

  $('<button/>').text('Save')
                .button()
                .click(save_options)
                .appendTo('#controls');

  $('#kb-options').buttonset();

  load_options();
}

$(init_page);
