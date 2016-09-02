namespace nf.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("NewsFeed")]
    public partial class NewsFeed
    {
        public int id { get; set; }

        [StringLength(2000)]
        public string content { get; set; }

        [Column(TypeName = "date")]
        public DateTime? date_published { get; set; }
    }
}
