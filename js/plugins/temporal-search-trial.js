/**
 * jspsych-html-keyboard-response
 * Josh de Leeuw
 *
 * plugin for displaying a stimulus and getting a keyboard response
 *
 * documentation: docs.jspsych.org
 *
 **/


jsPsych.plugins["temporal-search"] = (function() {

  var plugin = {};

  plugin.info = {
    name: 'temporal-search',
    description: '',
    parameters: {
      search_type: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Search type',
        default: "temporal"
      },
      stream_length: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'RSVP stream length',
        default: 16,
        description: "Number of search items contained within RSVP stream"
      },
      target_fill_index: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Target fill index',
        default: null,
        description: "Index value which corresponds to target fill."
      },
      target_present:{
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Target present',
        default: undefined,
        description: "Should target be present during trial?"
      },
      TD_cond: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Target-distractor condition',
        default: undefined,
        description: "Condition which defined fill similarity between target and distractors"
      },
      DD_cond: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'distractor-distractor condition',
        default: undefined,
        description: "Condition which defined fill similarity between distractors"
      },
      choices: {
        type: jsPsych.plugins.parameterType.KEYCODE,
        array: true,
        pretty_name: 'Choices',
        default: jsPsych.ALL_KEYS,
        description: 'The keys the subject is allowed to press to respond to the stimulus.'
      },
      fix_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Fixation duration',
        default: 1000,
        description: 'How long to present fixation before onset of first masking array.'
      },
      mask_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Masking stimulus duration',
        default: 50,
        description: 'How long to present masking stimulus.'
      },
      ISI_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Inter-stimulus interval',
        default: 0,
        description: 'Delay between offset of mask and onset of array, or vice-versa.'
      },
      item_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Search item duration',
        default: 150,
        description: 'How long to present search item before replacement.'
      },
      response_window: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Response window',
        default: 3000,
        description: 'Duration to listen for response following stream completion before trial self-terminates.'
      },
      feedback_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Feedback duration",
        default: 500,
        description: "Duration to present feedback before trial termination"
      }

    }
  }

  plugin.get_fills = function() {
    let fills = []

    if (trial_data.target_present) {
      fills.push(const_lum[trial_data.target_fill_index])
    }

    // Compute reference index used to select distractor fills
    let ref_color = (trial_data.TD_cond == 'HIGH') ? trial_data.target_fill_index : ((trial_data.target_fill_index + 180) % 359)

    // Get indices used to select distractor fills
    let distractor_fill_indices = [];

    if (trial_data.DD_cond == 'HIGH') {
      // self-similar distractors share single fill colour
      let adjust = randomChoice([-40, 40])
      distractor_fill_indices.push( ((ref_color + adjust) % 359))

    }
    else {
      // otherwise can have one of four fills
      distractor_fill_indices.push( ((ref_color + 20) % 359))
      distractor_fill_indices.push( ((ref_color + -20) % 359))
      distractor_fill_indices.push( ((ref_color + 40) % 359))
      distractor_fill_indices.push( ((ref_color + -40) % 359))

    }

    // Randomly select & push distractor fills until stream complete
    while (fills.length < trial_data.stream_length) {
      let fill_index = randomChoice(distractor_fill_indices);
      let fill_value = (fill_index > 0) ? const_lum[fill_index] : const_lum.endwards(fill_index)

      fills.push(fill_value)

    }

    fills = array_shuffle(fills)

    to_return = fills.reduce((r, a) => r.concat(a, 'white'), [1])

    return to_return

  }

  plugin.trial = function(display_element, trial) {

    $('#jspsych-loading-progress-bar-container').remove()

    trial_data = {
      search_type: trial.search_type,
      stream_length: trial.stream_length,
      target_fill_index: trial.target_fill_index,
      target_present: trial.target_present,
      TD_cond: trial.TD_cond,
      DD_cond: trial.DD_cond,
      fix_dur: trial.fix_duration,
      mask_dur: trial.mask_duration,
      search_dur: trial.item_duration,
      ISI: trial.ISI_duration,
      rt: null,
      response: null,
      accuracy: null,
    }

    // Given it's easier to use search-item here, instead of fixation, is fixation really necessary to define?
    var search_item = $('<div />').addClass('search-item')

    $(display_element).append(search_item)

    var stim_fills = plugin.get_fills()

    function timer(ms) {return new Promise(res => jsPsych.pluginAPI.setTimeout(res, ms))}

    async function fix_period () {
      await timer(trial_data.fix_dur)
    }

    async function run_rsvp () {
      for (let i=0; i < stim_fills.length; i++) {
        start = performance.now()

        // TODO: ask Jon why this doesn't work here...
        // $(search_item).css( 'background-color', `${stim_fills[i]}` )

        let delay = (i % 2 === 0) ? trial_data.search_dur : trial_data.mask_dur
        await timer(delay)
        $(search_item).css( 'background-color', `${stim_fills[i]}` )

        console.log(`elapsed {0}`.format(performance.now()-start))
      }
    }

    // Compute time after which trial self-aborts
    let trial_duration = trial_data.fix_dur + (trial_data.search_dur*16) + (trial_data.mask_dur*16) + trial_data.response_window


    var keyboardListener;

    jsPsych.pluginAPI.setTimeout(function() {
      keyboardListener = jsPsych.pluginAPI.getKeyboardResponse({
        callback_function: after_response,
        valid_responses: trial.choices,
        rt_method: 'performance',
        persist: false,
        allow_held_key: false
      })

    }, trial_duration)

    fix_period()
    run_rsvp()













    // store response
    var response = {
      rt: null,
      key: null,
      acc: null,
    };

    // function to end trial when it is time
    var end_trial = function() {

      // kill any remaining setTimeout handlers
      jsPsych.pluginAPI.clearAllTimeouts();

      // kill keyboard listeners
      if (typeof keyboardListener !== 'undefined') {
        jsPsych.pluginAPI.cancelKeyboardResponse(keyboardListener);
      }

      // gather the data to store for the trial
      var trial_data = {
        "rt": response.rt,
        "stimulus": trial.stimulus,
        "key_press": response.key
      };

      // clear the display
      display_element.innerHTML = '';

      // move on to the next trial
      jsPsych.finishTrial(trial_data);
    };

    // function to handle responses by the subject
    var after_response = function(info) {

      // after a valid response, the stimulus will have the CSS class 'responded'
      // which can be used to provide visual feedback that a response was recorded
      //display_element.querySelector('#jspsych-html-keyboard-response-stimulus').className += ' responded';

      // only record the first response
      if (response.key == null) {
        response = info;
      }

      if (trial.response_ends_trial) {
        end_trial();

    };


  };

  return plugin;
})();