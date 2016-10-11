---
layout: default
---

<center><img src="/img/books.png"></center>

## Articles

{% for page in site.posts %}
<div class="item" onclick="location.href='{{page.url}}'">
<p style="float:right" class="date">{{page.date | date: "%B %e, %Y"}}</p>
      <h3>{{page.title}}</h3>
      <p>{{page.description}}</p>
</div>
{% endfor %}
