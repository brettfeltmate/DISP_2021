var get_distractor_fills = function(ref_index, TD_Similarity, DD_Similarity) {

	let ref_val = (TD_Similarity == 'HI') ? ref_index : (ref_index + 180) % 360;

	let distractor_fill_indices = [];
	let distractor_fills = []

	if (DD_Similarity == 'HI') {
		let adjustment = randomChoice([-40, 40])
		let indx = (ref_val + adjustment) % 360
		distractor_fill_indices.push(indx)
	}
	else {
		let adjustment = [-40, -20, 20, 40]
		for (let i=0; i<adjustment.length; i++) {
			let indx = (ref_val + adjustment[i]) % 360
			distractor_fill_indices.push(indx)
		}
	}

	for (let i=0; i<distractor_fill_indices.length; i++) {
		if (distractor_fill_indices[i] < 0) {
			distractor_fills.push(const_lum.endwards(distractor_fill_indices[i]))
		}
		else {
			distractor_fills.push(const_lum[distractor_fill_indices[i]])
		}

	}

	return distractor_fills
}