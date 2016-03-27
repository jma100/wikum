draggingNode = null;
selectedNode = null;
activeBox = null;

delete_summary_nodes = [];
delete_summary_node_ids = [];
delete_summary_sents = [];
delete_summary_sent_ids = [];

function make_key() {
	
  var key_data = [
	{ "cx": 450, "cy": 80, "r": 7, "color" : "#7ca2c7", "text": "with replies"},
 	{ "cx": 450, "cy": 95, "r": 7, "color" : "#dae8f5", "text": "no replies"},
 	{ "cx": 450, "cy": 110, "r": 7, "color" : "#885ead", "text": "summary"},
 	{ "cx": 450, "cy": 125, "r": 7, "color" : "#ffd700", "text": "highlighted"},
 	];
 	
  var svg = d3.select("svg");
	
  var circles = svg.selectAll(".dataCircle")
                           .data(key_data)
                           .enter()
                           .append("circle");
                           
  var circleAttributes = circles
                       .attr("cx", function (d) { return d.cx; })
                       .attr("cy", function (d) { return d.cy; })
                       .attr("r", function (d) { return d.r; })
                       .style("fill", function (d) { return d.color; });

  var text = svg.selectAll("text")
                        .data(key_data)
                        .enter()
                        .append("text");
 
  var textLabels = text
                 .attr("x", function(d) { return d.cx + 10; })
                 .attr("y", function(d) { return d.cy + 4; })
                 .text( function (d) { return d.text; })
                 .attr("font-family", "sans-serif")
                 .attr("font-size", "10px")
                 .style('cursor', "default")
                 .attr("fill", "black");
}

$("#hide_modal_box").draggable({
    handle: ".modal-title"
}); 

$("#summarize_modal_box").draggable({
    handle: ".modal-title"
}); 

$("#summarize_multiple_modal_box").draggable({
    handle: ".modal-title"
}); 

$('#hide_modal_box').on('hidden.bs.modal', function () {
    var cnt = $(".ui-resizable").contents();
	$(".ui-resizable").replaceWith(cnt);
	$(".ui-resizable-handle").remove();
	$('#hide_comment_box').attr('style', '');
	$('#hide_comment_box').text('');
});

$('#summarize_modal_box').on('hidden.bs.modal', function () {
    var cnt = $(".ui-resizable").contents();
	$(".ui-resizable").replaceWith(cnt);
	$(".ui-resizable-handle").remove();
	$('#summarize_comment_box').attr('style', '');
	$('#summarize_comment_box').text('');
});

$('#summarize_multiple_modal_box').on('hidden.bs.modal', function () {
	$('#summarize_multiple_comment_box').text('');
});


$('#hide_modal_box').on('show.bs.modal', function(e) {
	var id = $(e.relatedTarget).data('id');
	var type = $(e.relatedTarget).data('type');
	
	$('#hide_comment_textarea').val("");
	
	d = nodes_all[id-1];
	var ids = [];
	var dids = [];
	
	highlight_box(id);
	if (type == "hide_comment") {
		var text = '<div class="hide_comment_comment">' + d.name + '</div>';
		$('#hide_comment_text').text('Hide this comment from view.');
	} else if (type == "hide_replies") {
		var text = '<strong>Original Comment: </strong><div class="hide_comment_comment">' + d.name + '</div><BR><strong>Replies:</strong><BR>';
		text = get_subtree(text, d, 0);
		$('#hide_comment_text').text('Hide the replies to this original comment from view.');
	} else if (type == "hide_all_selected") {
		var text = '';
		var datas = [];
		var min_level = 50;
		$('.clicked').each(function(index) {
			var id_clicked = parseInt($(this)[0].id.substring(5), 10);
			if (id_clicked != 1) {
				ids.push(id_clicked);
				var data = nodes_all[id_clicked-1];
				datas.push(data);
				dids.push(data.d_id);
				if (data.depth < min_level) {
					min_level = data.depth;
				}
			}
		});
		
		datas.sort(compare_nodes);
		for (var i in datas) {
			
			var class_sum = "";
			if (datas[i].replace_node) {
				var node_text = '<strong>Summary Node:</strong><BR>' + render_summary_node(datas[i]);
				var class_sum = "summary_box";
			} else if (datas[i].summary != '') {
				var node_text = '<strong>Summary:</strong> ' + render_summary_node(datas[i]);
			} else {
				var node_text = datas[i].name;
			}
			
			if (datas[i].depth - min_level <= 3) {
				var lvl = datas[i].depth - min_level;
			} else {
				var lvl = 3;
			}
			
			text += '<div class="hide_comment_comment level' + lvl + ' ' + class_sum + '"><P>ID: ' + datas[i].d_id + '</p>' + node_text+ '</div>';
			
		}
		
		$('#hide_comment_text').text('Hide all these comments from view.');
	}
	
	$('#hide_comment_box').html(text);
	$('#hide_comment_box').wrap('<div/>')
        .css({'overflow':'hidden'})
          .parent()
            .css({'display':'inline-block',
                  'overflow':'hidden',
                  'height':function(){return $('.resizable',this).height();},
                  'width':  function(){return $('.resizable',this).width();},
                  'paddingBottom':'12px',
                  'paddingRight':'12px',
                  'border': '1px solid #000000',
                 }).resizable()
                    .find('.resizable')
                      .css({overflow:'auto',
                            width:'100%',
                            height:'100%'});
	
	var did = $(e.relatedTarget).data('did');
	
	$("#hide_comment_submit").off("click");
	
	$('#hide_comment_submit').click({data_id: did, id: id, type: type, ids: ids, dids: dids}, function(evt) {
		
		var comment = $('#hide_comment_textarea').val();
		var article_id = $('#article_id').text();
		var csrf = $('#csrf').text();
		var data = {csrfmiddlewaretoken: csrf,
			comment: comment, 
			article: article_id};
		
		if (evt.data.type == "hide_comment") {
			data.id = evt.data.data_id; 
			$.ajax({
				type: 'POST',
				url: '/hide_comment',
				data: data,
				success: function() {
					$('#hide_modal_box').modal('toggle');
					success_noty();
					$('#comment_' + id).remove();
					hide_node(id);
				},
				error: function() {
					error_noty();
				}
			});
		} else if (evt.data.type == "hide_all_selected") {
			data.ids = evt.data.dids;
			$.ajax({
				type: 'POST',
				url: '/hide_comments',
				data: data,
				success: function() {
					$('#hide_modal_box').modal('toggle');
					success_noty();
					
					for (var i=0; i<evt.data.ids.length; i++) {
						$('#comment_' + evt.data.ids[i]).remove();
						hide_node(evt.data.ids[i]);
					}
				},
				error: function() {
					error_noty();
				}
			});
		} else {
			data.id = evt.data.data_id; 
			$.ajax({
				type: 'POST',
				url: '/hide_replies',
				data: data,
				success: function() {
					$('#hide_modal_box').modal('toggle');
					success_noty();
					
					var d = nodes_all[evt.data.id-1];
					
					if (d.children) {
						ids = [];
						for (var i=0; i<d.children.length; i++) {
							ids.push(d.children[i].id);
						}
						for (var i=0; i<ids.length; i++) {
							$('#comment_' + ids[i]).remove();
							hide_node(ids[i]);
						}
					} else if (d._children) {
						ids = [];
						for (var i=0; i<d._children.length; i++) {
							ids.push(d._children[i].id);
						}
						for (var i=0; i<d._children.length; i++) {
							$('#comment_' + ids[i]).remove();
							hide_node(ids[i]);
						}
					}
				},
				error: function() {
					error_noty();
				}
			});
		}
		
	});
});

function cite_para(did, para_num) {
	var box = $('#' + activeBox + '_comment_textarea');
	var cursorPos = box.prop('selectionStart');
    var v = box.val();
    var textBefore = v.substring(0,  cursorPos );
    var textAfter  = v.substring( cursorPos, v.length );
    box.val( textBefore + '[[comment_' + did + '_p' +  para_num + ']]\n' + textAfter );
}

function show_comment_text(text, did) {
	
	var regex = /<\/P>/gi, result, indices = [];
	while ((result = regex.exec(text))) {
	     indices.push(result.index);
	}
	
	if (indices.length > 1) {
		for (var i=indices.length-1; i>=0; i--) {
			if (text.substring(indices[i]-4, indices[i]-1) != '<p>') {
				cite_text = '<BR><a class="btn-xs btn-edit" onclick="cite_para(' + did + ',' + i + ')">Cite Paragraph</a>';
				text = text.slice(0, indices[i]) + cite_text + text.slice(indices[i]);
			}
		}
	}
	return text;
}

function insert_quote(highlighted_text, did) {
	var box = $('#' + activeBox + '_comment_textarea');
	var cursorPos = box.prop('selectionStart');
    var v = box.val();
    var textBefore = v.substring(0,  cursorPos );
    var textAfter  = v.substring( cursorPos, v.length );
    if (did == null) {
    	box.val( textBefore + '[quote]"' + highlighted_text + '"[endquote]\n' + textAfter );
    } else {
    	box.val( textBefore + '[quote]"' + highlighted_text + '" [[comment_' + did +']] [endquote]\n' + textAfter );
    }
}

$('#summarize_modal_box').on('show.bs.modal', function(e) {
	
	activeBox = 'summarize';
	
	var type = $(e.relatedTarget).data('type');
	
	var ids = [];
	var dids = [];
	
	
	
	var id = $(e.relatedTarget).data('id');
	var did = $(e.relatedTarget).data('did');
	
	d = nodes_all[id-1];
	
	highlight_box(id);
	if (type == "summarize_one") {
		var text = '<div id="sum_box_' + d.id + '" class="summarize_comment_comment"><P>ID: ' + d.d_id + '</P>' + show_comment_text(d.name, d.d_id) + '</div>';
		$('#summarize_comment_text').text('Summarize this comment.');
		$('#summarize_comment_textarea').val("");
	} else if (type == "edit_summarize_one") {
		var text = '<div id="sum_box_' + d.id + '" class="summarize_comment_comment"><P>ID: ' + d.d_id + '</P>' + show_comment_text(d.name, d.d_id) + '</div>';
		$('#summarize_comment_textarea').val(d.summary);
		$('#summarize_comment_text').text('Edit the summary for this comment.');
	} 
	
	text = '<div class="img-rounded" id="tooltip_sum">Quote</div>' + text;
	
	$('#summarize_comment_box').html(text);
	$('#summarize_comment_box').wrap('<div/>')
        .css({'overflow':'hidden'})
          .parent()
            .css({'display':'inline-block',
                  'overflow':'hidden',
                  'height':function(){return $('.resizable',this).height();},
                  'width':  function(){return $('.resizable',this).width();},
                  'paddingBottom':'12px',
                  'paddingRight':'12px',
                  'border': '1px solid #000000',
                 }).resizable()
                    .find('.resizable')
                      .css({overflow:'auto',
                            width:'100%',
                            height:'100%'});
	
	$("#summarize_comment_box").off("mouseup");
	$("#summarize_comment_box").off("mousedown");
	
	
	$("#tooltip_sum").off("click");
	
	$('#tooltip_sum').mousedown(function(evt) {
		evt.stopPropagation();
	}).mouseup(function(evt) {
		evt.stopPropagation();
		insert_quote(highlighted_text, null);
	});

	$('#summarize_comment_box').mouseup(function(evt) {
		clearTimeout(cancelClick);
		if (!isClick) {
			highlighted_text = window.getSelection().toString();
	   		if (highlighted_text.length > 10) {
	   			highlighted_comm = parseInt(evt.target.parentNode.id.substring(8));
	   			var offset = $("#summarize_comment_box").offset();
	   			var scroll = $("#summarize_comment_box").scrollTop();
	   			$('#tooltip_sum').css({'top': evt.pageY - offset.top + scroll + 'px', 'left': evt.pageX - offset.left + 'px'});
	   			$('#tooltip_sum').show();
	   		}
	 } else {
	  	$('#tooltip_sum').hide();
	  }
	  isClick = true;
	})
	.mousedown(function(evt) {
		cancelClick = setTimeout(is_click, 250);
	});
	
	$("#summarize_comment_submit").off("click");
	
	$('#summarize_comment_submit').click({data_id: did, id: id, type: type, ids: ids, dids: dids}, function(evt) {
		
		var comment = $('#summarize_comment_textarea').val().trim();
		var article_id = $('#article_id').text();
		var csrf = $('#csrf').text();
		var data = {csrfmiddlewaretoken: csrf,
			comment: comment, 
			article: article_id};
		
		data.id = evt.data.data_id; 
		$.ajax({
			type: 'POST',
			url: '/summarize_comment',
			data: data,
			success: function() {
				$('#summarize_modal_box').modal('toggle');
				
				success_noty();
				
				d = nodes_all[evt.data.id-1];
				
				d.summary = comment;
				
				var text = '<P><strong>Summary:</strong> ' + render_summary_node(d) + '</P>';
				
				if (evt.data.type == "summarize_one") {
					text += '<P><a data-toggle="modal" data-backdrop="false" data-did="' + evt.data.id + '" data-target="#summarize_modal_box" data-type="edit_summarize_one" data-id="' + evt.data.id + '">Edit Comment Summary</a>';

					text += ' | <a onclick="toggle_original(' + evt.data.id + ');">View Original Comment</a></p>';
					text += '<div id="orig_' + evt.data.id + '" style="display: none;">' + d.name + '</div>';
				}
					
				$('#comment_text_' + evt.data.id).html(text);
				
				highlight_box(evt.data.id);
			},
			error: function() {
				error_noty();
			}
		});
	});
});


$('#summarize_multiple_modal_box').on('show.bs.modal', function(e) {

	activeBox = 'summarize_multiple';
	
	$("#summarize_multiple_modal_box").css({
	    'margin-top': function () { 
	        return ($(this).height() / 4);
	    },
	    'margin-left': function () {
	        return ($(this).width() / 4);
	    }
	});
	
	
	var type = $(e.relatedTarget).data('type');
	
	var ids = [];
	var dids = [];
	
	if (type == "summarize_selected") {
		var objs = [];
		var min_level = 50;
		d3.selectAll('.clicked').each( function(data) {
			if (!data.article) {
				objs.push(data);
				if (data.depth < min_level) {
					min_level = data.depth;
				}
			}
		});

		objs.sort(compare_nodes);
		var text = '';
		for (var i in objs) {
			ids.push(objs[i].id);
			dids.push(objs[i].d_id);
			
			if (objs[i].depth - min_level <= 3) {
				var depth = objs[i].depth - min_level;
			} else {
				var depth = 3;
			}
			if (objs[i].replace_node) {
				text += '<div id="sum_box_' + objs[i].id + '" class="summarize_comment_comment summary_box level' + depth + '"><P>ID: ' + objs[i].d_id + ' | <a class="btn-xs btn-edit" onclick="copy_summary_node(' + objs[i].id + ');">Cut & Paste Summary</a> | <a class="btn-xs btn-edit" onclick="copy_summary(' + objs[i].id + ');">Copy Summary</a> | <a class="btn-xs btn-edit" onclick="cite_comment(' + objs[i].d_id +');">Cite Summary</a></P><strong>Summary Node:</strong><BR>' + render_summary_node_edit(objs[i]) + '</div>';
			} else {
				if (objs[i].summary != "") {
					text += '<div id="sum_box_' + objs[i].id + '" class="summarize_comment_comment level' + depth + '"><P>ID: ' + objs[i].d_id + ' | <a class="btn-xs btn-edit" onclick="copy_summary(' + objs[i].id + ');">Copy Entire Summary</a> | <a class="btn-xs btn-edit" onclick="cite_comment(' + objs[i].d_id +');">Cite Comment</a></P><strong>Summary:</strong> ' + render_summary_node_edit(objs[i]) + '</div>';
				} else {
					text += '<div id="sum_box_' + objs[i].id + '" class="summarize_comment_comment level' + depth + '"><P>ID: ' + objs[i].d_id + ' | <a class="btn-xs btn-edit" onclick="cite_comment(' + objs[i].d_id +');">Cite Comment</a></P>' + show_comment_text(objs[i].name, objs[i].d_id) + '</div>';
				}
			}
		}
		$('#summarize_multiple_comment_text').text('Summarize these selected comments.');
		$('#summarize_multiple_comment_textarea').val("");
	} else {
	
		var id = $(e.relatedTarget).data('id');
		var did = $(e.relatedTarget).data('did');
		
		d = nodes_all[id-1];
		
		highlight_box(id);
		if (type == "summarize") {
			if (d.summary != '') {
				var text = '<div id="sum_box_' + d.id + '" class="summarize_comment_comment"><P>ID: ' + d.d_id + ' | <a class="btn-xs btn-edit" onclick="copy_summary(' + d.id + ');">Copy Entire Summary</a> | <a class="btn-xs btn-edit" onclick="cite_comment(' + d.d_id +');">Cite Comment</a></P><strong>Summary: </strong> ' + render_summary_node_edit(d) + '</div>';
			} else {
				var text = '<div id="sum_box_' + d.id + '" class="summarize_comment_comment"><P>ID: ' + d.d_id + ' | <a class="btn-xs btn-edit" onclick="cite_comment(' + d.d_id +');">Cite Comment</a></P>' + show_comment_text(d.name, d.d_id) + '</div>';
			}
			text = get_subtree_summarize(text, d, 1);
			$('#summarize_multiple_comment_text').text('Summarize this comment and all replies (replaces them all).');
			$('#summarize_multiple_comment_textarea').val("");
		} else if (type == "edit_summarize") {
			
			show_replace_nodes(d.id);
			
			if (d.replace_node) {
				if (d.replace.length > 0) {
					var text = '';
					for (var i=0; i<d.replace.length; i++) {
						if (d.replace[i].summary != '') {
							text += '<div id="sum_box_' + d.replace[i].id + '" class="summarize_comment_comment"><P>ID: ' + d.replace[i].d_id + ' | <a class="btn-xs btn-edit" onclick="copy_summary(' + d.replace[i].id + ');">Copy Entire Summary</a> | <a class="btn-xs btn-edit" onclick="cite_comment(' + d.replace[i].d_id +');">Cite Comment</a></P><strong>Summary: </strong> ' + render_summary_node_edit(d.replace[i]) + '</div>';
						} else {
							text += '<div id="sum_box_' + d.replace[i].id + '" class="summarize_comment_comment"><P>ID: ' + d.replace[i].d_id + ' | <a class="btn-xs btn-edit" onclick="cite_comment(' + d.replace[i].d_id +');">Cite Comment</a></P>' + show_comment_text(d.replace[i].name, d.replace[i].d_id)  + '</div>';
						}
						text = get_subtree_summarize(text, d.replace[i], 1);
					}
					
				} else if (d.children.length > 0) {
					var text = '';
					for (var i=0; i<d.children.length; i++) {
						if (d.children[i].summary != '') {
							text += '<div id="sum_box_' + d.children[i].id + '" class="summarize_comment_comment"><P>ID: ' + d.children[i].d_id + ' | <a class="btn-xs btn-edit" onclick="copy_summary(' + d.children[i].id + ');">Copy Entire Summary</a> | <a class="btn-xs btn-edit" onclick="cite_comment(' + d.children[i].d_id +');">Cite Comment</a></P><strong>Summary: </strong> ' + render_summary_node_edit(d.children[i]) + '</div>';
						} else {
							text += '<div id="sum_box_' + d.children[i].id + '" class="summarize_comment_comment"><P>ID: ' + d.children[i].d_id + ' | <a class="btn-xs btn-edit" onclick="cite_comment(' + d.children[i].d_id +');">Cite Comment</a></P>' + show_comment_text(d.children[i].name, d.children[i].d_id) + '</div>';
						}
						text = get_subtree_summarize(text, d.children[i], 1);
					}
				}
			} else {
				var text = '<div id="sum_box_' + d.children[0].id + '" class="summarize_comment_comment"><P>ID: ' + d.children[0].d_id + ' | <a class="btn-xs btn-edit" onclick="cite_comment(' + d.children[0].d_id +');">Cite Comment</a></P>' + show_comment_text(d.children[0].name, d.children[0].d_id) + '</div>';
				text = get_subtree_summarize(text, d.children[0], 1);
			}
			$('#summarize_multiple_comment_textarea').val(d.summary);
			$('#summarize_multiple_comment_text').text('Edit the summary for this entire subtree of comments.');
		}
	}
	
	text = '<div class="img-rounded" id="tooltip_sum2">Quote</div>' + text;
	
	$('#summarize_multiple_comment_box').html(text);
	
	$("#summarize_multiple_comment_box").off("mouseup");
	$("#summarize_multiple_comment_box").off("mousedown");
	
	
	$("#tooltip_sum2").off("click");
	
	
	$('#tooltip_sum2').mousedown(function(evt) {
		evt.stopPropagation();
	}).mouseup(function(evt) {
		evt.stopPropagation();
		insert_quote(highlighted_text, nodes_all[highlighted_comm - 1].d_id);
	});
	
	$('#summarize_multiple_comment_box').mouseup(function(evt) {
		clearTimeout(cancelClick2);
		if (!isClick2) {
			highlighted_text = window.getSelection().toString();
	   		if (highlighted_text.length > 10) {
	   			highlighted_comm = parseInt(evt.target.parentNode.id.substring(8));
	   			var offset = $("#summarize_multiple_comment_box").offset();
	   			var scroll = $("#summarize_multiple_comment_box").scrollTop();
	   			$('#tooltip_sum2').css({'position': 'relative', 'top': (evt.pageY - offset.top + scroll) + 'px', 'left': evt.pageX - offset.left + 'px'});
	   			$('#tooltip_sum2').css('visibility','visible');
	   		}
	 } else {
	  	$('#tooltip_sum2').css('visibility','hidden');
	  }
	  isClick2 = true;
	})
	.mousedown(function(evt) {
		cancelClick2 = setTimeout(is_click2, 250);
	});
	
	$("#summarize_multiple_comment_submit").off("click");
	
	$('#summarize_multiple_comment_submit').click({data_id: did, id: id, type: type, ids: ids, dids: dids}, function(evt) {
		
		var comment = $('#summarize_multiple_comment_textarea').val().trim();
		var article_id = $('#article_id').text();
		var csrf = $('#csrf').text();
		var data = {csrfmiddlewaretoken: csrf,
			comment: comment, 
			article: article_id,
			delete_nodes: delete_summary_nodes,
			delete_sents: JSON.stringify(delete_summary_sents),
		};
		
		if (evt.data.type == "summarize_selected") {
			data.ids = evt.data.dids;
			
			var objs = [];
			d3.selectAll('.clicked').each( function(data) {
				if (!data.article) {
					objs.push(data);
					if (data.depth < min_level) {
						min_level = data.depth;
					}
				}
			});
			
			children = [];
			children_dids = [];
			lowest_id = 500;
			lowest_d = null;
			size = 0;
			for (var i=0; i<objs.length; i++) {
				if (objs[i].depth == min_level) {
					children.push(objs[i]);
					children_dids.push(objs[i].d_id);
					if (objs[i].id < lowest_id) {
						lowest_id = objs[i].id;
						lowest_d = objs[i];
					}
					if (objs[i].size > size) {
						size = objs[i].size;
					}
				}
			}
			
			data.children = children_dids;
			data.child = lowest_d.d_id;
			
			$.ajax({
				type: 'POST',
				url: '/summarize_selected',
				data: data,
				success: function(res) {
					
					for (var i=0; i<delete_summary_node_ids.length; i++) {
						delete_summary_node(delete_summary_node_ids[i]);
					}
					
					for (var i=0; i<delete_summary_sent_ids.length; i++) {
						delete_summary_sent(delete_summary_sents[i], delete_summary_sent_ids[i]);
					}
					
					delete_summary_nodes = [];
					delete_summary_node_ids = [];
					
					delete_summary_sents = [];
					delete_summary_sent_ids = [];
					
					new_d = {d_id: res.d_id,
							 name: "",
							 summary: comment,
							 parent: lowest_d.parent,
							 replace: children,
							 author: "",
							 replace_node: true,
							 size: size,
							 depth: lowest_d.depth,
							 x: lowest_d.x,
							 x0: lowest_d.x0,
							 y: lowest_d.y,
							 y0: lowest_d.y0,
							};
							
					for (var d=0; d<children.length; d++) {
						for (var i=0; i<children[d].parent.children.length; i++) {
							if (children[d].parent.children[i] == children[d]) {
								children[d].parent.children.splice(i,1);
	  							break;
							}
						}
						children[d].parent = new_d;
					}
					
					insert_node_to_children(new_d, new_d.parent);
					
					update(new_d.parent);
					
					d3.select("#node_" + new_d.id)
					.style("fill","purple");
					
					$('#summarize_multiple_modal_box').modal('toggle');
					
					var text = '<div id="comment_text_' + new_d.id + '"><strong>Summary Node:</strong><BR>' + render_summary_node(new_d) + '</div>';
					text += '<BR><P><a data-toggle="modal" data-backdrop="false" data-did="' + new_d.id + '" data-target="#summarize_multiple_modal_box" data-type="edit_summarize" data-id="' + new_d.id + '">Edit Summary Node</a> | <a onclick="post_delete_summary_node(' + new_d.id + ');">Delete Summary Node</a></P>';
					
					for (var i=0; i<children.length; i++) {
						if (children[i] == lowest_d) {
							$('#comment_' + children[i].id).html(text);
							$('#comment_' + children[i].id).addClass('summary_box');
							$('#comment_' + children[i].id).attr('id', 'comment_' + new_d.id);
						} else {
							$('#comment_' + children[i].id).remove();
						}
					}
					clear_box_top();
				}
			});
		} else if (evt.data.type == "summarize" || evt.data.type == "edit_summarize") {
			data.id = evt.data.data_id; 
			$.ajax({
				type: 'POST',
				url: '/summarize_comments',
				data: data,
				success: function(res) {
					
					for (var i=0; i<delete_summary_node_ids.length; i++) {
						delete_summary_node(delete_summary_node_ids[i]);
					}
					
					delete_summary_nodes = [];
					delete_summary_node_ids = [];
					
					
					for (var i=0; i<delete_summary_sent_ids.length; i++) {
						delete_summary_sent(delete_summary_sents[i], delete_summary_sent_ids[i]);
					}
					
					delete_summary_sents = [];
					delete_summary_sent_ids = [];
					
					var d = nodes_all[evt.data.id-1];
					
					$('#summarize_multiple_modal_box').modal('toggle');
					
					if (evt.data.type == "summarize") {
						
						new_d = {d_id: res.d_id,
							 name: "",
							 summary: comment,
							 parent: d.parent,
							 replace: [d],
							 author: "",
							 replace_node: true,
							 size: d.size,
							 depth: d.depth,
							 x: d.x,
							 x0: d.x0,
							 y: d.y,
							 y0: d.y0,
							};
							
						for (var i=0; i<d.parent.children.length; i++) {
							if (d.parent.children[i] == d) {
								 d.parent.children.splice(i,1);
      							break;
							}
						}
					
						d.parent = new_d;
						
						insert_node_to_children(new_d, new_d.parent);
						
						update(new_d.parent);
					
						d3.select("#node_" + new_d.id)
						.style("fill","purple");

						$('#comment_' + d.id).addClass('summary_box');
						$('#comment_' + d.id).attr('id', 'comment_' + new_d.id);
						
						delete_children_boxes(new_d.replace[0]);
						
						d = new_d;
					}
					
					d.summary = comment;
					
					var text = '<div id="comment_text_' + d.id + '"><strong>Summary Node:</strong><BR>' + render_summary_node(d) + '</div>';
					text += '<BR><P><a data-toggle="modal" data-backdrop="false" data-did="' + d.id + '" data-target="#summarize_multiple_modal_box" data-type="edit_summarize" data-id="' + d.id + '">Edit Summary Node</a> | <a onclick="post_delete_summary_node(' + d.id + ');">Delete Summary Node</a></P>';
					
					$('#comment_' + d.id).html(text);
					
					highlight_box(d.id);
					success_noty();
				},
				error: function() {
					error_noty();
				}
			});
		}
		
	});
});

function delete_summary_sent(sent_info, id) {
	sent = sent_info[1];
	
	d = nodes_all[id-1];
	
	d.summary = d.summary.replace(sent, '');
	
	d.summary = d.summary.replace(/(?:\n\n)/g, '\n');
	
	text = construct_comment(d);
	
	$('#comment_' + id).html(text);
	
}

function post_delete_summary_node(id) {
	d = nodes_all[id-1];
	if (d.replace_node) {
		var article_id = $('#article_id').text();
		var csrf = $('#csrf').text();
		var data = {csrfmiddlewaretoken: csrf,
			comment: '', 
			article: article_id,
			id: d.d_id};
		
		$.ajax({
				type: 'POST',
				url: '/hide_comment',
				data: data,
				success: function() {
					delete_summary_node(id);
					success_noty();
				},
				error: function() {
					error_noty();
				}
		});
	
	}
}

function delete_summary_node(id) {

	$('#comment_' +id).remove();

	d = nodes_all[id-1];
	if (d.replace_node) {
		parent = d.parent;
		
		//delete node from parent's children
		for (var i=0; i<parent.children.length; i++) {
			if (parent.children[i] == d) {
				parent.children.splice(i,1);
			}
		}
		
		//change node's children's parent
		if (d.replace) {
			for (var i=0; i<d.replace.length; i++) {
				d.replace[i].parent = parent;
				insert_node_to_children(d.replace[i], parent);
			}
		}
		if (d.children) {
			for (var i=0; i<d.children.length; i++) {
				d.children[i].parent = parent;
				insert_node_to_children(d.children[i], parent);
			}
		} else if (d._children) {
			for (var i=0; i<d._children.length; i++) {
				d._children[i].parent = parent;
				insert_node_to_children(d._children[i], parent);
			}
		}
	}
	update(d.parent);
}

function insert_node_to_children(node_insert, node_parent) {
	added = false;
	for (var i=0; i<node_parent.children.length; i++) {
		if (node_parent.children[i].size < node_insert.size) {
			node_parent.children.splice(i, 0, node_insert);
			added = true;
			break;
		}
	}
	if (!added) {
		node_parent.children.push(node_insert);
	}	
}

function insert_node_to_un_children(node_insert, node_parent) {
	added = false;
	for (var i=0; i<node_parent._children.length; i++) {
		if (node_parent._children[i].size < node_insert.size) {
			node_parent._children.splice(i, 0, node_insert);
			added = true;
			break;
		}
	}
	if (!added) {
		node_parent._children.push(node_insert);
	}	
}

function insert_node_to_replace(node_insert, node_parent) {
	added = false;
	for (var i=0; i<node_parent.replace.length; i++) {
		if (node_parent.replace[i].size < node_insert.size) {
			node_parent.replace.splice(i, 0, node_insert);
			added = true;
			break;
		}
	}
	if (!added) {
		node_parent.replace.push(node_insert);
	}	
}

function get_subtree(text, d, level) {
	
	if (level <= 3) {
		var lvl = level;
	} else {
		var lvl = 3;
	}
	
	if (d.children) {
		for (var i=0; i<d.children.length; i++) {
			if (d.children[i].summary != '') {
				if (d.children[i].replace_node) {
					text += '<div class="hide_comment_comment summary_box level' + lvl + '"><strong>Summary Node:</strong><BR>' + render_summary_node(d.children[i]) + '</div>';
				} else {
					text += '<div class="hide_comment_comment level' + lvl + '"><strong>Summary:</strong> ' + render_summary_node(d.children[i]) + '</div>';
				}
			} else {
				text += '<div class="hide_comment_comment level' + lvl + '">' + d.children[i].name + '</div>';
			}
			if (!d.children[i].replace_node) {
				text = get_subtree(text, d.children[i], level+1);
			}
		}
	} else if (d._children) {
		for (var i=0; i<d._children.length; i++) {
			if (d._children[i].summary != '') {
				if (d._children[i].replace_node) {
					text += '<div class="hide_comment_comment summary_box level' + lvl + '"><strong>Summary Node:</strong><BR>' + render_summary_node(d._children[i]) + '</div>';
				} else {
					text += '<div class="hide_comment_comment level' + lvl + '"><strong>Summary:</strong> ' + render_summary_node(d._children[i]) + '</div>';
				}
			} else {
				text += '<div class="hide_comment_comment level' + lvl + '">' + d._children[i].name + '</div>';
			}
			if (!d._children[i].replace_node) {
				text = get_subtree(text, d._children[i], level+1);
			}
		}
	}
		
	return text;
}

function get_subtree_summarize(text, d, level) {
	if (level <= 2) {
		var lvl = level;
	} else {
		var lvl = 2;
	}
	
	if (d.children) {
		for (var i=0; i<d.children.length; i++) {

			if (d.children[i].summary != '') {
				if (d.children[i].replace_node) {
					text += '<div id="sum_box_' + d.children[i].id + '" class="summary_box summarize_comment_comment level' + lvl + '"><P>ID: ' + d.children[i].d_id + ' | <a class="btn-xs btn-edit" onclick="copy_summary_node(' + d.children[i].id + ');">Cut & Paste Summary</a> | <a class="btn-xs btn-edit" onclick="copy_summary(' + d.children[i].id + ');">Copy Summary</a> | <a class="btn-xs btn-edit" onclick="cite_comment(' + d.children[i].d_id +');">Cite Summary</a></P><strong>Summary Node:</strong><BR>' + render_summary_node_edit(d.children[i]) + '</div>';
				} else {
					text += '<div id="sum_box_' + d.children[i].id + '" class="summarize_comment_comment level' + lvl + '"><P>ID: ' + d.children[i].d_id + ' | <a class="btn-xs btn-edit" onclick="copy_summary(' + d.children[i].id + ');">Copy Entire Summary</a> | <a class="btn-xs btn-edit" onclick="cite_comment(' + d.children[i].d_id +');">Cite Comment</a></P><strong>Summary: </strong> ' + render_summary_node_edit(d.children[i]) + '</div>';
				}
			} else {
				text += '<div id="sum_box_' + d.children[i].id + '" class="summarize_comment_comment level' + lvl + '"><P>ID: ' + d.children[i].d_id + ' | <a class="btn-xs btn-edit" onclick="cite_comment(' + d.children[i].d_id +');">Cite Comment</a></P>' + show_comment_text(d.children[i].name, d.children[i].d_id) + '</div>';
			}
			if (!d.children[i].replace_node) {
				text = get_subtree_summarize(text, d.children[i], level+1);
			}
		}
	} else if (d._children) {
		for (var i=0; i<d._children.length; i++) {
			if (d._children[i].summary != '') {
				if (d._children[i].replace_node) {
					text += '<div id="sum_box_' + d._children[i].id + '" class="summarize_comment_comment summary_box level' + lvl + '"><P>ID: ' + d._children[i].d_id + ' | <a class="btn-xs" btn-edit onclick="copy_summary_node(' + d._children[i].id + ');">Cut & Paste Summary</a> | <a class="btn-xs" btn-edit onclick="copy_summary(' + d._children[i].id + ');">Copy Summary</a> | <a class="btn-xs btn-edit" onclick="cite_comment(' + d._children[i].d_id +');">Cite Summary</a></P><strong>Summary Node:</strong><BR>' + render_summary_node_edit(d._children[i]) + '</div>';
				} else {
					text += '<div id="sum_box_' + d._children[i].id + '" class="summarize_comment_comment level' + lvl + '"><P>ID: ' + d._children[i].d_id + ' | <a class="btn-xs btn-edit" onclick="copy_summary(' + d._children[i].id + ');">Copy Entire Summary</a> | <a class="btn-xs btn-edit" onclick="cite_comment(' + d._children[i].d_id +');">Cite Comment</a></P><strong>Summary:</strong> ' + render_summary_node_edit(d._children[i]) + '</div>';
				}
			} else {
				text += '<div id="sum_box_' + d._children[i].id + '" class="summarize_comment_comment level' + lvl + '"><P>ID: ' + d._children[i].d_id + ' | <a class="btn-xs btn-edit" onclick="cite_comment(' + d._children[i].d_id +');">Cite Comment</a></P>' + show_comment_text(d._children[i].name, d._children[i].d_id) + '</div>';
			}
			text = get_subtree_summarize(text, d._children[i], level+1);
		}
	}
		
	return text;
}

function find_child_did(d, d_id) {
	var was_hid = false;
	if (d._children) {
		d.children = d._children;
		d._children = null;
		was_hid = true;
	}
	var was_rep = false;
	if (d.replace.length != 0) {
		d.children = d.replace;
		d.replace = [];
		was_rep = true;
	}
	if (d.children) {
		for (var i=0; i<d.children.length; i++) {
			if (d.children[i].d_id == d_id) {
				return d.children[i];
			} else if (d.children[i].replace_node && d.children[i].summary.indexOf("[[comment_" + d_id + "]]") > -1) {
				return d.children[i];
			}
			val = find_child_did(d.children[i], d_id);
			if (val != null) return val;
		}
	}
	
	if (was_hid) {
		d._children = d.children;
		d.children = null;
	}
	if (was_rep) {
		d.replace = d.children;
		d.children = null;
	}
	
	return null;
}

function open_comment_hyperlink(id) {
	link = event.target.text;
	
	var d_id = parseInt(link.substring(8));
	
	d3.selectAll( '.clicked').classed( "clicked", false);
  	unhighlight_all();
	
	show_replace_nodes(id);
	d = nodes_all[id-1];
	show_text(d);
	
	para = null;
	
	if (link.indexOf('_p') > -1) {
		index = link.indexOf('_p');
		para = parseInt(event.target.text.substring(index + 2));
	}
	
	if (para != null && d.d_id == d_id) {
		toggle_original(d.id);
		
		$('#orig_' + d.id).children().eq(para).addClass('highlight');
		$("#box").scrollTo(".highlight", 500);
		
	} else {
		child = find_child_did(d, d_id);
		update(d);
		show_text(d);
		extra_highlight_node(child.id);
		highlight_box(child.id);
		
		if (para != null) {
			if ($('#comment_' + child.id).text().indexOf('Summary: ') > -1) {
				toggle_original(child.id);
				$('#orig_' + child.id).children().eq(para).addClass('highlight');
			} else {
				$('#comment_text_' + child.id).children().eq(para).addClass('highlight');
			}
			$("#box").scrollTo(".highlight", 500);
		} else {
			$("#box").scrollTo("#comment_" + child.id, 500);
		}
	}
}

function copy_summary_node_quote(did, id) {
	node = $(event.target).parent()[0];
	text = $(event.target).parent()[0].innerText;
	text = text.replace(/\[/g, "[[");
	text = text.replace(/\]/g, "]]");
	text = text.substring(0, text.length - 12);
	
	var regex = /Copy This/g;
	if (text.match(regex)) {
		subs = null;
		while (match = regex.exec(text)) {
			var index = match.index;
			subs = text.substring(index+10);
		}
		text = subs;
	}
	
	var regex = / \| Cut & Paste This/g;
	if (text.match(regex)) {
		subs = null;
		while (match = regex.exec(text)) {
			var index = match.index;
			subs = text.substring(0, index);
		}
		text = subs;
	}
	
	text = text.trim();
	
	if (node.tagName == "BLOCKQUOTE") {
		text = '[quote]' + text + ' [endquote]';	
	}
	
	var html_str = $(node).html();
	
	if (html_str.indexOf("This following text will be deleted.") == -1) {
		delete_summary_sents.push([did, text]);
		delete_summary_sent_ids.push(id);
		if (html_str.substring(0,1) == '\n') {
			html_str = html_str.substring(1);
			html_str = '<BR><strong style="color:red;">This following text will be deleted.</strong> <a class="btn-xs btn-warning" onclick="undo_delete_summary_quote(' + did + ');">Undo</a> ' + html_str;

		} else {
			html_str = '<strong style="color:red;">This following text will be deleted.</strong> <a class="btn-xs btn-warning" onclick="undo_delete_summary_quote(' + did + ');">Undo</a> ' + html_str;
		}
	}
	
	$(node).html(html_str);
	
	var box = $('#' + activeBox + '_comment_textarea');
	var cursorPos = box.prop('selectionStart');
    var v = box.val();
    var textBefore = v.substring(0,  cursorPos );
    var textAfter  = v.substring( cursorPos, v.length );
    box.val( textBefore + text + '\n' + textAfter );
}

function copy_summary_quote() {
	node = $(event.target).parent()[0];
	text = $(event.target).parent()[0].innerText;
	text = text.replace(/\[/g, "[[");
	text = text.replace(/\]/g, "]]");
	text = text.substring(0, text.length - 12);
	
	var regex = /Copy This/g;
	if (text.match(regex)) {
		subs = null;
		while (match = regex.exec(text)) {
			var index = match.index;
			subs = text.substring(index+10);
		}
		text = subs;
	}
	
	var regex = / \| Cut & Paste This/g;
	if (text.match(regex)) {
		subs = null;
		while (match = regex.exec(text)) {
			var index = match.index;
			subs = text.substring(0, index);
		}
		text = subs;
	}
	
	text = text.trim();
	
	if (node.tagName == "BLOCKQUOTE") {
		text = '[quote]' + text + ' [endquote]';	
	}
	
	var box = $('#' + activeBox + '_comment_textarea');
	var cursorPos = box.prop('selectionStart');
    var v = box.val();
    var textBefore = v.substring(0,  cursorPos );
    var textAfter  = v.substring( cursorPos, v.length );
    box.val( textBefore + text + '\n' + textAfter );
}

function render_summary_node_edit(d) {
	text = d.summary;
	
	if (d.replace_node) {
		var regex = /(?:\n\n)/g, result, indices = [];
		while ((result = regex.exec(text))) {
		     indices.push(result.index);
		}
		
		if (indices.length > 0) {
			for (var i=indices.length-1; i>=0; i--) {
				cite_text = '<BR><a class="btn-xs btn-edit" onclick="cite_para(' + d.d_id + ',' + i + ')">Cite Paragraph</a></span></P><P><span>';
				text = text.slice(0, indices[i]) + cite_text + text.slice(indices[i]);
			}
			text = text + '<BR><a class="btn-xs btn-edit" onclick="cite_para(' + d.d_id + ',' + indices.length + ')">Cite paragraph</a></span></P><P><span>';
		}
	} else {
		text = text.replace(/(?:\n\n)/g, '</P><P>');
	}
	
	
	text = '<P><span>' + text + '</span></P>';
	
	var pattern = /\[\[/g;
	text = text.replace(pattern, '[<a onclick="open_comment_hyperlink(' + d.id + ');">');
	var pattern = /\]\]/g;
	
	matches = text.match(pattern);
	if (matches != null) {
		matches = matches.length;
	} else {
		matches = 0;
	}
	
	if (matches > 1) {
		if (d.replace_node) {
			text = text.replace(pattern, '</a>] | <a class="btn-xs btn-edit" onclick="copy_summary_node_quote(' + d.d_id + ',' + d.id + ');">Cut & Paste This</a> | <a class="btn-xs btn-edit" onclick="copy_summary_quote();">Copy This</a></span><span>');
		} else {
			text = text.replace(pattern, '</a>] | <a class="btn-xs btn-edit" onclick="copy_summary_quote();">Copy This</a></span><span>');
		}
	} else {
		text = text.replace(pattern, '</a>]');
	}
	
	var pattern = /\[quote\]/g;
	text = text.replace(pattern, '<blockquote>');
	var pattern = /\[endquote\]/g;
	text = text.replace(pattern, '</blockquote>');

	return text;
}

function copy_summary(id) {
	d = nodes_all[id - 1];
	text = d.summary;
	
	if (!d.replace_node) {
		if (text.indexOf('[[') == -1) {
			text += ' [[comment_' + d.d_id + ']]';
		}
	}
	
	var box = $('#' + activeBox + '_comment_textarea');
	var cursorPos = box.prop('selectionStart');
    var v = box.val();
    var textBefore = v.substring(0,  cursorPos );
    var textAfter  = v.substring( cursorPos, v.length );
    box.val( textBefore + text + '\n' + textAfter );
	
}

function undo_delete_summary_quote(did) {
	
	var node = $(event.target).parent()[0];
	var html = $(event.target).parent().html();
	
	var spl = html.split('Undo</a> ');
	
	$(node).html(spl[1]);
	
	var text = $(node)[0].innerText;
	
	text = text.split(" | Cut & Paste This | Copy This")[0];
	
	var pattern = /\[/g;
	text = text.replace(pattern, '[[');
	var pattern = /\]/g;
	text = text.replace(pattern, ']]');
	
	index = -1;
	for (var i=0; i<delete_summary_sents.length; i++) {
		if (delete_summary_sents[i][0] == did && delete_summary_sents[i][1] == text) {
			index = i;
		}
	}
	if (index != -1) {
		delete_summary_sents.splice(index, 1);
		delete_summary_sent_ids.splice(index, 1);
	}
}

function undo_delete_summary(did, id) {
	for (var i = delete_summary_nodes.length - 1; i >= 0; i--) {
	    if(delete_summary_nodes[i] === did) {
	       delete_summary_nodes.splice(i, 1);
	       delete_summary_node_ids.splice(i, 1);
	    }
	}
	
	var html_str = $('#sum_box_' + id).html();
	var x = html_str.split('<br>');
	var str = html_str.substring(x[0].length + 4);
	$('#sum_box_' + id).html(str);
}

function copy_summary_node(id) {
	var d = nodes_all[id - 1];
	
	var html_str = $('#sum_box_' + id).html();
	
	if (html_str.indexOf("This summary will be deleted.") == -1) {
		delete_summary_nodes.push(d.d_id);
		delete_summary_node_ids.push(d.id);
		html_str = '<strong style="color:red;">This summary will be deleted.</strong> <a class="btn-xs btn-warning" onclick="undo_delete_summary(' + d.d_id + ',' + id + ');">Undo</a><BR>' + html_str;
	}
	
	$('#sum_box_' + id).html(html_str);
	
	var text = d.summary;
	
	var box = $('#' + activeBox + '_comment_textarea');
	var cursorPos = box.prop('selectionStart');
    var v = box.val();
    var textBefore = v.substring(0,  cursorPos );
    var textAfter  = v.substring( cursorPos, v.length );
    box.val( textBefore + text + '\n' + textAfter );
	
}

function render_summary_node(d) {
	
	text = d.summary;
	var pattern = /\[\[/g;
	text = text.replace(pattern, '[<a onclick="open_comment_hyperlink(' + d.id + ');">');
	var pattern = /\]\]/g;
	text = text.replace(pattern, '</a>]');
	
	var pattern = /\[quote\]/g;
	text = text.replace(pattern, '<blockquote>');
	var pattern = /\[endquote\]/g;
	text = text.replace(pattern, '</blockquote>');
	
	return text;
	
}

function cite_comment(did) {
	var box = $('#' + activeBox + '_comment_textarea');
	var cursorPos = box.prop('selectionStart');
    var v = box.val();
    var textBefore = v.substring(0,  cursorPos );
    var textAfter  = v.substring( cursorPos, v.length );
    box.val( textBefore + '[[comment_' + did +']]\n' + textAfter );
}

function delete_children_boxes(node) {
	if (node.children) {
		for (var i=0; i<node.children.length; i++) {
			$('#comment_' + node.children[i].id).remove();
			delete_children_boxes(node.children[i]);
		}
	}
}

function success_noty() {
	noty({
	    text: 'Your change is saved!',
	    layout: 'topCenter',
	    type: 'success',
	    timeout: 1500,
	    closeOnSelfClick: true,
        closeOnSelfOver: false,
	    animation: {
	        open: {height: 'toggle'},
	        close: {height: 'toggle'},
	        easing: 'swing',
	        speed: 500
	    }
	});
}

function error_noty() {
	noty({
	    text: 'Sorry, an error occurred.',
	    layout: 'topCenter',
	    type: 'error',
	    timeout: 1500,
	    closeOnSelfClick: true,
        closeOnSelfOver: false,
	    animation: {
	        open: {height: 'toggle'},
	        close: {height: 'toggle'},
	        easing: 'swing',
	        speed: 500
	    }
	});
}

function make_highlight() {
	text = '<input type="text" class="form-control input-sm" id="inputHighlight" placeholder="Highlight text"><div id="count_result"></div>';
	$('#node_highlight').html(text);
	
	$('#inputHighlight').keyup(function (e) {
		 
	 	$('#box').removeHighlight();
	  	
	  	for (var i=1; i<nodes_all.length; i++) {
				d3.select("#node_" + nodes_all[i].id)
						.style("fill", color(nodes_all[i]));
		}
		
		$('#count_result').text('0 comments highlighted');
		 
	
	  	highlight_text = $('#inputHighlight').val();
	  	count = 0;
	  	if (highlight_text.length > 0) {
	  		var pattern = new RegExp('\\b' + highlight_text.toLowerCase() + '\\b');
		  	for (var i=1; i<nodes_all.length; i++) {
		  		text = nodes_all[i].name;
		  		if (pattern.test(text.toLowerCase())) {
		  			d3.select("#node_" + nodes_all[i].id)
						.style("fill","#ffd700");
					count += 1;
		  		}
		  	}
		  	$('#box').highlight(highlight_text);
		  	
			$('#count_result').text(count + ' comments highlighted');
		
		}
	});  
}

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function dragstart(d) {
    if (d.article || d.parent_node) {
        return;
    }
    dragStarted = true;
    d3.event.sourceEvent.stopPropagation();
}


function initiateDrag(d, domNode) {
    draggingNode = d;
    
    d3.selectAll(".clicked").classed("clicked", false);
    unhighlight_all();
    
    d3.select(domNode).select('.ghostCircle').attr('pointer-events', 'none');
        d3.selectAll('.ghostCircle').attr('class', 'ghostCircle show');
        d3.select(domNode).attr('class', 'node activeDrag');
    
    
    svg.selectAll("g.node").sort(function(a, b) { // select the parent and sort the path's
            if (a.id != draggingNode.id) return 1; // a is not the hovered element, send "a" to the back
            else return -1; // a is the hovered element, bring "a" to the front
        });
        
    nodes = tree.nodes(d);
    
    // if nodes has children, remove the links and nodes
    if (nodes.length > 1) {
        // remove link paths
        links = tree.links(nodes);
        nodePaths = svg.selectAll("path.link")
            .data(links, function(d) {
                return d.target.id;
            }).remove();
        // remove child nodes
        nodesExit = svg.selectAll("g.node")
            .data(nodes, function(d) {
                return d.id;
            }).filter(function(d, i) {
                if (d.id == draggingNode.id) {
                    return false;
                }
                return true;
            }).remove();
    }

    // remove parent link
    parentLink = tree.links(tree.nodes(draggingNode.parent));
    svg.selectAll('path.link').filter(function(d, i) {
        if (d.target.id == draggingNode.id) {
            return true;
        }
        return false;
    }).remove();

    dragStarted = null;
}

function dragmove(d) {
    if (d.article || d.parent_node) {
        return;
    }
    if (dragStarted) {
        domNode = this;
        initiateDrag(d, domNode);
        dragStarted = null;
    }
    
    $('#expand').hide();
    
    
    x = d3.event.x, y = d3.event.y;
    
	node = d3.select(this);
	node.attr("transform", "translate(" + x+ "," + y + ")");
	updateTempConnector();
}

  var overCircle = function(d) {
  		if (d != draggingNode) {
	        selectedNode = d;
	        updateTempConnector();
	    }
    };
    var outCircle = function(d) {
        selectedNode = null;
        updateTempConnector();
    };

 var updateTempConnector = function() {
        if (draggingNode !== null && selectedNode !== null) {
        	node = d3.select('#node_' + selectedNode.id);
            node.attr("r", 20)
            	.attr('class', 'selected');
            	
        } else {
        	d3.selectAll('.selected')
        	.classed("selected", false)
        	.attr('r', function(d) {
        		return (d.size + 400 )/65; 
        	});
        }
};

function expand(d) {
	if (d.replace_node) {
		show_replace_nodes(d.id);
	} else {
		expand_recurs(d);
	}
}

function dragend(d) {
 	if (d.article || d.parent_node) {
        return;
    }
    
    domNode = this;
    if (selectedNode) {
        save_node_position();
    } else {
    	
    	d.x0 = 0;
		d.y0 = 0;
		
		node = d3.select(this);
		node
		.attr("transform", "translate(" + d.y0 + "," + d.x0 + ")")
		.attr("r", function(d) { 
	      	return (d.size + 400 )/65; 
	    });
        endDrag();
    }
}

function save_node_position() {
	
	var csrf = $('#csrf').text();
	data = {csrfmiddlewaretoken: csrf,
			new_parent: selectedNode.d_id,
			node: draggingNode.d_id};
	
	$.ajax({
		type: 'POST',
		url: '/move_comments',
		data: data,
		success: function(res) {
			
			
			// now remove the element from the parent, and insert it into the new elements children
	        var index = draggingNode.parent.children.indexOf(draggingNode);
	        if (index > -1) {
	            draggingNode.parent.children.splice(index, 1);
	        }
	        draggingNode.parent = selectedNode;
	        if (typeof selectedNode.children !== 'undefined' || typeof selectedNode._children !== 'undefined') {
	            if (typeof selectedNode.children !== 'undefined') {
	            	insert_node_to_children(draggingNode, selectedNode);
	            } else {
	            	insert_node_to_un_children(draggingNode, selectedNode);
	            }
	        } else {
	        	if (selectedNode.replace_node) {
	        		insert_node_to_replace(draggingNode, selectedNode);
	        	} else {
	        		selectedNode.children = [];
	            	selectedNode.children.push(draggingNode);
	        	}
	        }
	        // Make sure that the node being added to is expanded so user can see added node is correctly moved
	        expand(selectedNode);
	        
	        draggingNode.x0 = 0;
			draggingNode.y0 = 0;
	        
	        endDrag();
	        
			success_noty();
		},
		error: function() {
			
			draggingNode.x0 = 0;
			draggingNode.y0 = 0;
			
			node = d3.select('#node_' + draggingNode.id);
			node.attr("transform", "translate(" + draggingNode.y0 + "," + draggingNode.x0 + ")")
				.attr("r", function(d) { 
			      	return (d.size + 400 )/65; 
			    });
			    
	        endDrag();
			
			error_noty();
		}
	});
}


function endDrag() {
    selectedNode = null;
    d3.selectAll('.ghostCircle').attr('class', 'ghostCircle');
    d3.select(domNode).attr('class', 'node');
    // now restore the mouseover event or we won't be able to drag a 2nd time
    d3.select(domNode).select('.ghostCircle').attr('pointer-events', '');
    updateTempConnector();
    if (draggingNode !== null) {
    	
    	d3.select("#node_" + draggingNode.id)
			.attr("transform", "translate(" + 0 + "," + 0 + ")");
			
        update(draggingNode.parent);
        
        draggingNode = null;
    }
}

function update(source) {

  // Compute the flattened node list. TODO use d3.layout.hierarchy.
  var nodes = tree.nodes(root);

  var height = Math.max($(window).height() - 250, 100 + nodes.length * barHeight + margin.top + margin.bottom);

  d3.select("svg").transition()
      .duration(duration)
      .attr("height", height);
      
  d3.select("rect").transition()
      .duration(duration)
      .attr("height", height);

  d3.select(self.frameElement).transition()
      .duration(duration)
      .style("height", height + "px");

  // Compute the "layout".
  nodes.forEach(function(n, i) {
    n.x = (i * barHeight) + 100;
    n.y = n.y + 100;
  });

  // Update the nodes…
  var node = svg.selectAll("g.node")
      .data(nodes, function(d) { 
	      	if (d.id) {
	      		nodes_all[d.id-1] = d;
	      		return d.id;
	      	} else {
	      		d.id = ++i;
	      		nodes_all[d.id-1] = d;
	      		return d.id;
	      	}
      	});

  var nodeEnter = node.enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
      .style("opacity", 1e-6);

  var node_drag = d3.behavior.drag()
  	.origin(function(d) { return {x: 0, y: 0}; })
    .on("dragstart", dragstart)
    .on("drag", dragmove)
    .on("dragend", dragend);
  

  // Enter any new nodes at the parent's previous position.
  nodeEnter.append("circle")
      .attr("r", function(d) { 
      	if (d.article) {
      		return 10;
      	} else {
      		return (d.size + 400 )/65; 
      	}
      	})
      .attr("height", barHeight)
      .style("stroke-width", stroke_width)  
      .style("stroke", stroke)
      .style("fill", color)
      .attr("id", function(d) { return 'node_' + d.id; })
      .on("click", function(d) {
      	d3.selectAll(".clicked").classed("clicked", false);
      	unhighlight_all();
      	show_text(d);
      	$('#box').scrollTop(0);
      	if (highlight_text) {
      		$('#box').highlight(highlight_text);
      	}
      })
      .on("mouseover", showdiv)
      .on("mouseout", hidediv)
      .call(node_drag);
      
	nodeEnter.append("circle")
            .attr('class', 'ghostCircle')
            .attr("r", 20)
            .attr("opacity", 0.0) // change this to zero to hide the target area
        .style("fill", "red")
            .attr('pointer-events', 'mouseover')
            .on("mouseover", function(node) {
                overCircle(node);
            })
            .on("mouseout", function(node) {
                outCircle(node);
            });

  // Transition nodes to their new position.
  nodeEnter.transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })
      .style("opacity", 1);

  node.transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })
      .style("opacity", 1)
    .select("rect")
      .style("fill", color);

  // Transition exiting nodes to the parent's new position.
  node.exit().transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
      .style("opacity", 1e-6)
      .remove();

  // Update the links…
  var link = svg.selectAll("path.link")
      .data(tree.links(nodes), function(d) {
      	if (d.source.article) {
      		return null;
      	} else {
      		return d.target.id;
      	}
      	});

  // Enter any new links at the parent's previous position.
  link.enter().insert("path", "g")
      .attr("class", "link")
      .attr("d", function(d) {
    	var o = {x: source.x0, y: source.y0};
    	return diagonal({source: o, target: o});
      })
      .attr("id", function(d) { 
     	return 'link_' + d.source.id + '_' + d.target.id;
      })
    .transition()
      .duration(duration)
      .attr("d", diagonal);

  // Transition links to their new position.
  link.transition()
      .duration(duration)
      .attr("d", diagonal);

  // Transition exiting nodes to the parent's new position.
  link.exit().transition()
      .duration(duration)
      .attr("d", function(d) {
        var o = {x: source.x, y: source.y};
        return diagonal({source: o, target: o});
      })
      .remove();

  // Stash the old positions for transition.
  nodes.forEach(function(d) {
    d.x0 = d.x;
    d.y0 = d.y;
  });
}

function is_click() {
	isClick = false;
}

function is_click2() {
	isClick2 = false;
}

function hide_node(id) {
	d = nodes_all[id-1];
	parent = d.parent;
	
	// add to hidden list
	parent.hid.push(d);
	
	// remove from children list
	if (parent.children) {
		index = parent.children.indexOf(d);
		if (index > -1) {
			parent.children.splice(index, 1);
		}
		if (parent.children.length == 0) {
			delete parent.children;
		}
	}
	
	// remove from _children list
	if (parent._children) {
		index = parent._children.indexOf(d);
		if (index > -1) {
			parent._children.splice(index, 1);
		}
		if (parent._children.length == 0) {
			delete parent._children;
		}
	}
	
	update(parent);
	
	d3.select('#node_' + parent.id).style('fill', color);
	return null;
}

function recurse_hide_node(d) {
	if (d.children) {
		for (var i=0; i<d.children.length; i++) {
			$('#comment_' + d.children[i].id).remove();
			recurse_hide_node(d.children[i]);
		}
	}
}

// Toggle children on click.
function click_node(id) {
  d = nodes_all[id-1];
  
  if (d.children) {
	recurse_hide_node(d);
    d._children = d.children;
    d.children = null;
  } else {
    d.children = d._children;
    d._children = null;
  }
  
  update(d);
  return null;
}

function collapse_recurs(d) {
	if (d.children) {
	    d._children = d.children;
	    d.children = null;
	  }
	if (d._children) {
		for (var i=0; i<d._children.length; i++) {
			collapse_recurs(d._children[i]);
		}
	}
}

function expand_recurs(d) {
	if (d._children) {
	    d.children = d._children;
	    d._children = null;
	  }
	if (d.children) {
		for (var i=0; i<d.children.length; i++) {
			expand_recurs(d.children[i]);
		}
	}
}

// Toggle children on click.
function collapse_node(id) {
  d = nodes_all[id-1];
	if (d._children) {
	    d.children = d._children;
	    d._children = null;
	  }
	if (d.children) {
		for (var i=0; i<d.children.length; i++) {
			collapse_recurs(d.children[i]);
		}
	}
  update(d);
  setTimeout( function(){ 
    show_text('clicked');
  }  , 2000 );
  
  return null;
}

// Toggle children on click.
function expand_node(id) {
  d = nodes_all[id-1];
  expand_recurs(d);
  update(d);
  return null;
}

function toggle_original(id) {
	$('#orig_' + id).toggle();
}

function construct_comment(d) {
	var text = 'ID: ' + d.d_id + '<BR>';
	var summary = false;
	if (d.summary != '') {
		summary = true;
	}
	
	if (summary) {
		if (d.replace_node) {
			text += '<div id="comment_text_' + d.id + '"><strong>Summary Node:</strong><BR>' + render_summary_node(d);
		} else {
			text += '<div id="comment_text_' + d.id + '"><strong>Summary:</strong> ' + render_summary_node(d);	
		}
	} else {
		text += '<div id="comment_text_' + d.id + '">' + d.name;
		text += '<P>-- ' + d.author + '</P>';
		text += '<P>Likes: ' + d.size + '</P>';
	}
	text += '</div>';
	
	if (summary) {
		if (!d.replace_node) {
			text += '<BR><P><a data-toggle="modal" data-backdrop="false" data-did="' + d.d_id + '" data-target="#summarize_modal_box" data-type="edit_summarize_one" data-id="' + d.id + '">Edit Comment Summary</a>';
			text += ' | <a onclick="toggle_original(' + d.id + ');">View Original Comment</a></p>';
			text += '<div id="orig_' + d.id + '" style="display: none;">' + d.name + '</div>';
		} else {
			text += '<BR><P><a data-toggle="modal" data-backdrop="false" data-did="' + d.d_id + '" data-target="#summarize_multiple_modal_box" data-type="edit_summarize" data-id="' + d.id + '">Edit Summary Node</a> | <a onclick="post_delete_summary_node(' + d.id + ');">Delete Summary Node</a>';
		
		}
		
		
	}
	
	if (!summary && d.name.length > 300) {
		text += '<hr><P>';
		if (!d.children && !d.replace_node) {
			text += '<a data-toggle="modal" data-backdrop="false" data-did="' + d.d_id + '" data-target="#summarize_modal_box" data-type="summarize_one" data-id="' + d.id + '">Summarize Comment</a> | ';
			text += '<a data-toggle="modal" data-backdrop="false" data-did="' + d.d_id + '" data-target="#hide_modal_box" data-type="hide_comment" data-id="' + d.id + '">Mark as Unimportant</a>';
		} else if (!d.replace_node) {
			if (!(d.parent && d.parent.replace_node)) {
				text += '<a data-toggle="modal" data-backdrop="false" data-did="' + d.d_id + '" data-target="#summarize_multiple_modal_box" data-type="summarize" data-id="' + d.id + '">Summarize Comment and all Replies</a> | ';
			}
			text += '<a data-toggle="modal" data-backdrop="false" data-did="' + d.d_id + '" data-target="#summarize_modal_box" data-type="summarize_one" data-id="' + d.id + '">Summarize Comment</a> | ';
			text += '<a data-toggle="modal" data-backdrop="false" data-did="' + d.d_id + '" data-target="#hide_modal_box" data-type="hide_replies" data-id="' + d.id + '">Mark all Replies Unimportant</a>';
		}
		text += '</p>';
	} else {
		if (!d.children && !d.replace_node) {
			text += '<hr><P>';
			text += '<a data-toggle="modal" data-backdrop="false" data-did="' + d.d_id + '" data-target="#hide_modal_box" data-type="hide_comment" data-id="' + d.id + '">Mark as Unimportant</a>';
			text += '</p>';
		} else if (!d.replace_node) {
			text += '<hr><P>';
			if (!(d.parent && d.parent.replace_node)) {
				text += '<a data-toggle="modal" data-backdrop="false" data-did="' + d.d_id + '" data-target="#summarize_multiple_modal_box" data-type="summarize" data-id="' + d.id + '">Summarize Comment and all Replies</a> | ';
			}
			text += '<a data-toggle="modal" data-backdrop="false" data-did="' + d.d_id + '" data-target="#hide_modal_box" data-type="hide_replies" data-id="' + d.id + '">Mark all Replies Unimportant</a></p>';
		}
	}
	return text;
}

function escapeHtml(text) {
    'use strict';
    return text.replace(/[\"&<>]/g, function (a) {
        return { '"': '&quot;', '&': '&amp;', '<': '&lt;', '>': '&gt;' }[a];
    });
}

function clear_box_top() {
	$('#box_top').html('');
	$('#box_top').css('border-bottom', '0px');
}


function get_subtree_box(text, d, level) {
	if (d.children) {
		for (var i=0; i<d.children.length; i++) {
			if (d.children[i].replace_node) {
				if (level == 0) {
					text += '<div class="comment_box summary_box" id="comment_' + d.children[i].id + '">';
				} else if (level == 1) {
					text += '<div class="comment_box summary_box level1" id="comment_' + d.children[i].id + '">';
				} else if (level == 2) {
					text += '<div class="comment_box summary_box level2" id="comment_' + d.children[i].id + '">';
				} else if (level > 2) {
					text += '<div class="comment_box summary_box level3" id="comment_' + d.children[i].id + '">';
				}
			} else {
				if (level == 0) {
					text += '<div class="comment_box" id="comment_' + d.children[i].id + '">';
				} else if (level == 1) {
					text += '<div class="comment_box level1" id="comment_' + d.children[i].id + '">';
				} else if (level == 2) {
					text += '<div class="comment_box level2" id="comment_' + d.children[i].id + '">';
				} else if (level > 2) {
					text += '<div class="comment_box level3" id="comment_' + d.children[i].id + '">';
				}
			}

			text +=  construct_comment(d.children[i]);
			text += '</div>';
			highlight_node(d.children[i].id);
			text = get_subtree_box(text, d.children[i], level+1);
		}
	}
		
	return text;
}

function highlight_node(id) {
	if (id != 1) {
		d3.select("#node_" + id)
			.attr("class", "clicked")
			.style("stroke","#000000")
			.style("stroke-width", "2px");
	}
}

function unhighlight_all() {
	for (var i=1; i<nodes_all.length; i++) {
		d3.select("#node_" + nodes_all[i].id)
		.style("stroke-width", "0px");
	}
}

function highlight_link(from_id, to_id) {
	d3.select("#link_" + from_id + '_' + to_id).transition()
		.style("stroke", "red")
		.style("stroke-width", "3px")
		.each("end", function() {
			extra_highlight_node(from_id);
			d3.select(this)
				.transition()
				.style("stroke", "#cccccc")
				.style("stroke-width", "2px");
				
		});
}

function show_parent(id) {
	d = nodes_all[id-1];
	unextra_highlight_node(id);
	parent = d.parent;
	highlight_node(parent.id);
	highlight_link(parent.id, id);
	show_text('clicked');
}

function show_text(d) {
	if (d && d != 'clicked') {
		clear_box_top();
		if (d.article) {
			var text = '';
			text = get_subtree_box(text, d, 0);
		} else {
			if (d.replace_node) {
				var text = '<div class="comment_box summary_box" id="comment_' + d.id + '">';
			} else {
				var text = '<div class="comment_box" id="comment_' + d.id + '">';
			}
			
			if (d.depth > 1) {
				text += '<a onclick="show_parent(' + d.id + ');">Show parent comment</a><BR>';
			} 
			
			text += construct_comment(d);
			text += '</div>';
			highlight_node(d.id);
			text = get_subtree_box(text, d, 1);
		}
		$('#box').html(text);
	} else if (d && d != 'clicked') {
		$('#box').html(d.name);
		clear_box_top();
	} else if (d == null){
		$('#box').html('');
		clear_box_top();
	} else {
		$('#box').html('');
		clear_box_top();
		var objs = [];
		var min_level = 50;
		d3.selectAll('.clicked').each( function(data) {
			if (!data.article) {
				objs.push(data);
				if (data.depth < min_level) {
					min_level = data.depth;
				}
			}
		});
		
		if (objs.length > 1) {
			construct_box_top(objs);
		}
		
		objs.sort(compare_nodes);
		for (var i in objs) {
			var text = '';
			if (objs[i].replace_node) {
				
				if (objs[i].depth - min_level == 0) {
					text += '<div class="comment_box summary_box" id="comment_' + objs[i].id + '">';
					if (objs[i].depth > 1) {
						text += '<a onclick="show_parent(' + objs[i].id + ');">Show parent comment</a><BR>';
					} 
				} else if (objs[i].depth - min_level == 1) {
					text += '<div class="comment_box summary_box level1" id="comment_' + objs[i].id + '">'; 
				} else if (objs[i].depth - min_level == 2) {
					text += '<div class="comment_box summary_box level2" id="comment_' + objs[i].id + '">'; 
				} else {
					text += '<div class="comment_box summary_box level3" id="comment_' + objs[i].id + '">'; 
				}
				
			} else {
				if (objs[i].depth - min_level == 0) {
					text += '<div class="comment_box" id="comment_' + objs[i].id + '">'; 
					if (objs[i].depth > 1) {
						text += '<a onclick="show_parent(' + objs[i].id + ');">Show parent comment</a><BR>';
					} 
				} else if (objs[i].depth - min_level == 1) {
					text += '<div class="comment_box level1" id="comment_' + objs[i].id + '">'; 
				} else if (objs[i].depth - min_level == 2) {
					text += '<div class="comment_box level2" id="comment_' + objs[i].id + '">'; 
				} else {
					text += '<div class="comment_box level3" id="comment_' + objs[i].id + '">'; 
				}
				
				
			}
			text += construct_comment(objs[i]);
			text += '</div>';
			$('#box').append(text);
		};
	}
	
	$('.comment_box').hover(
		  function() {
		    var id = parseInt(this.id.substring(8));
		    extra_highlight_node(id);
		  }, function() {
		    var id = parseInt(this.id.substring(8));
		    unextra_highlight_node(id);
		  }
	);
}

function extra_highlight_node(id) {
	if (id != 1) {
		d3.select("#node_" + id)
			.style("stroke","#d73c37")
			.style("stroke-width", "2px");
		highlight_box(id);
	}
}

function unextra_highlight_node(id) {
	if (id != 1) {
		d3.select("#node_" + id)
			.style("stroke","#000000")
			.style("stroke-width", "2px");
		highlight_box(id);
	}
}

function construct_box_top(objs) {
	
	var parent_node = null;
	
	accepted = true;
	count = 0;
	
	for (var i=0; i<objs.length; i++) {
		parent = objs[i].parent;
		if (objs[i].children) {
			for (var c=0; c<objs[i].children.length; c++) {
				child = objs[i].children[c];
				if (objs.indexOf(child) == -1) {
					accepted = false;
					break;
				}
			}
		}
		
		if (objs[i]._children) {
			for (var c=0; c<objs[i]._children.length; c++) {
				child = objs[i]._children[c];
				if (objs.indexOf(child) == -1) {
					accepted = false;
					break;
				}
			}
		}
		
		if (objs.indexOf(parent) != -1) {
			continue;
		}
		if (parent_node && parent == parent_node) {
			count += 1;
			continue;
		}
		if (!parent_node) {
			parent_node = parent;
			count += 1;
			continue;
		}
		
		accepted = false;
		break;
	}
	
	if (accepted && count > 1 && !parent_node.replace_node) {
		var text = '<a data-toggle="modal" data-backdrop="false" data-target="#summarize_multiple_modal_box" data-type="summarize_selected">Summarize and Group all Selected</a>';
		text += ' | <a data-toggle="modal" data-backdrop="false" data-target="#hide_modal_box" data-type="hide_all_selected">Mark all Selected as Unimportant</a>';
		
		$('#box_top').css('border-bottom', '#000000 1px solid');
		$('#box_top').html(text);
	}
}

function compare_nodes(a,b) {
  if (a.id < b.id)
    return -1;
  else if (a.id > b.id)
    return 1;
  else 
    return 0;
}

function highlight_box(id) {
	$('.highlighted').removeClass('highlighted');
	$('#comment_' + id).addClass('highlighted');
}

function set_expand_position(d) {
	var offset = $('svg').offset();
	var width = $('#expand').width();
	if (d.article) {
		var node_width = 10;
	} else {
		var node_width = (d.size + 400)/65;
	}
	$('#expand').css({top: offset.top + d.x + 22, 
		left: offset.left + d.y + ((d.size + 100)/60) - width + 10 - node_width});
}

function showdiv(d) {
	if (!isMouseDown) {
		if (d.replace_node) {
			clearTimeout(timer);

			if (d.children || d._children) {
				$('#expand').html('<a onclick="hide_replace_nodes(' + d.id + ');">Hide Summarized Nodes</a>');		
			} else {
				$('#expand').html('<a onclick="show_replace_nodes(' + d.id + ');">See Summarized Nodes</a>');	
			}
			
			set_expand_position(d);
			$('#expand').show();
		} else if (d.children || d._children) {
			clearTimeout(timer);
			
			one_depth = true;
			if (d.children){
				for (var i=0; i<d.children.length; i++) {
					if (d.children[i].children || d.children[i]._children) {
						one_depth = false;
					}
				}
			}
			if (d._children) {
				for (var i=0; i<d._children.length; i++) {
					if (d._children[i].children || d._children[i]._children) {
						one_depth = false;
					}
				}
			}
			
			if (one_depth) {
				$('#expand').html('<a onclick="click_node(' + d.id + ');">Toggle</a>');
			} else {
				$('#expand').html('<a onclick="click_node(' + d.id + ');">Toggle</a><BR><a onclick="collapse_node(' + d.id + ');">Collapse replies</a><BR><a onclick="expand_node(' + d.id + ');">Expand replies</a>');
			}
			
			set_expand_position(d);
			
			$('#expand').show();
		}
		
		if (d3.select(this).classed("clicked")) {
			extra_highlight_node(d.id);
			highlight_box(d.id);
			hover_timer = window.setTimeout(function(d) {
				$("#box").scrollTo("#comment_" + d.id, 500);
			}, 500, d);
		}
	}
}


function hide_replace_nodes(id) {
	d = nodes_all[id-1];
	
	delete_children_boxes(d);
	if (d.children) {
		if (!d.replace) {
			d.replace = [];
		}
		for (var i=0; i<d.children.length; i++) {
			d.replace.push(d.children[i]);
		}
		d.children = null;
		update(d);
	}
	$('#expand').html('<a onclick="show_replace_nodes(' + d.id + ');">See Summarized Nodes</a>');
}

function show_replace_nodes(id) {
	d = nodes_all[id-1];
	if (d.replace) {
		if (!d.children) {
			d.children = [];
		}
		for (var i=0; i<d.replace.length; i++) {
			d.children.push(d.replace[i]);
		}
		d.replace = [];
		update(d);	
	}
	$('#expand').html('<a onclick="hide_replace_nodes(' + d.id + ');">Hide Summarized Nodes</a>');
}

function hidediv(d) {
	if (!isMouseDown && d3.select(this).classed("clicked")) {
		unextra_highlight_node(d.id);
	}
	window.clearTimeout(hover_timer);
	timer = setTimeout(remove_dic, 100);
	
}

function remove_dic() {
	$('#expand').hide();
}

$("#expand").mouseleave(function() {
    timer = setTimeout(remove_dic, 100);
}).mouseenter(function() {
    clearTimeout(timer);
});


function stroke_width(d) {
	if (d.article) {
		return 3;
	}
}

function stroke(d) {
	if (d.article) {
		return "#000000";
	}
 }

function color(d) {
	
	if (d.parent_node) {
		return "#cccccc";
	}
	
	if (d.replace_node) {
		return "#885ead";
	}
	if (d.article) {
		return "#ffffff";
	}
	if (d._children || d.children) {
		return "#7ca2c7";
	} else {
		return "#dae8f5";
	}
}